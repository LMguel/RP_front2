/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageLayout from '../sections/PageLayout';
import RecordsTabs from '../components/RecordsTabs';
import RecordsFilters from '../components/RecordsFilters';
import TimeRecordForm from '../components/TimeRecordForm';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Collapse,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  FileDownload as FileDownloadIcon,
  Delete as DeleteIcon,
  AccessTime as AccessTimeIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { TimeRecord, Employee } from '../types';

interface EmployeeSummary {
  funcionario_id: string;
  funcionario: string;
  funcionario_nome: string;
  horas_trabalhadas: number;
  total_horas: number;
}

const RecordsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Estados principais
  const [tabValue, setTabValue] = useState(0); // 0 = Resumo, 1 = Detalhado
  const [employeeSummaries, setEmployeeSummaries] = useState<EmployeeSummary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<TimeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para busca unificada
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  
  // Estados para filtros
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Estados para ordenação
  const [sortBy, setSortBy] = useState<'funcionario' | 'data' | 'status'>('data');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Estados para dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<TimeRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Estados para snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  // Função para buscar registros
  const buscarRegistros = useCallback(async () => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setError('A data de início não pode ser maior que a data de fim.');
      setEmployeeSummaries([]);
      setRecords([]);
      setFilteredRecords([]);
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      if (tabValue === 1) {
        // Para registros detalhados, buscar registros individuais de TODOS os funcionários
        console.log('🔍 Buscando TODOS os registros individuais de entrada/saída...');
        
        let allRecords: TimeRecord[] = [];
        
        try {
          // Estratégia 1: Buscar todos os funcionários e depois seus registros individuais
          console.log('📊 Buscando lista de funcionários...');
          const employeesResponse = await apiService.getEmployees();
          const employeesList = employeesResponse.funcionarios || [];
          console.log('👥 Funcionários encontrados:', employeesList.length);
          
          // Para cada funcionário, buscar TODOS os seus registros individuais
          for (const employee of employeesList) {
            try {
              console.log(`📊 Buscando registros individuais de: ${employee.nome}`);
              
              // Tentar diferentes parâmetros para buscar registros individuais
              const strategies = [
                { funcionario_id: employee.id, individual: true },
                { funcionario_id: employee.id, detailed: true },
                { funcionario_id: employee.id, type: 'individual' },
                { funcionario_id: employee.id }
              ];
              
              let employeeRecords = [];
              
              for (const params of strategies) {
                try {
                  console.log(`  🔧 Tentando parâmetros:`, params);
                  const response = await apiService.getTimeRecords(params);
                  console.log(`  📋 Resposta:`, response);
                  
                  if (Array.isArray(response) && response.length > 0) {
                    // Verificar se são registros individuais (têm data_hora, tipo, etc.)
                    const hasIndividualData = response.some(record => 
                      record.data_hora && record.tipo && (record.tipo === 'entrada' || record.tipo === 'saída')
                    );
                    
                    if (hasIndividualData) {
                      employeeRecords = response;
                      console.log(`  ✅ Encontrados ${employeeRecords.length} registros individuais`);
                      break;
                    } else {
                      console.log(`  ⚠️ Resposta não contém registros individuais`);
                    }
                  } else if (response && typeof response === 'object') {
                    // Verificar propriedades do objeto que podem conter registros
                    const possibleProps = ['registros', 'records', 'data', 'items', 'timeRecords', 'detalhes'];
                    for (const prop of possibleProps) {
                      if (Array.isArray(response[prop])) {
                        const hasIndividualData = response[prop].some(record => 
                          record.data_hora && record.tipo
                        );
                        if (hasIndividualData) {
                          employeeRecords = response[prop];
                          console.log(`  ✅ Encontrados registros em ${prop}:`, employeeRecords.length);
                          break;
                        }
                      }
                    }
                    if (employeeRecords.length > 0) break;
                  }
                } catch (strategyError) {
                  console.log(`  ❌ Erro com parâmetros ${JSON.stringify(params)}:`, strategyError);
                }
              }
              
              // Se encontrou registros, adicionar informações do funcionário e incluir na lista
              if (employeeRecords.length > 0) {
                const recordsWithEmployeeInfo = employeeRecords.map(record => ({
                  ...record,
                  funcionario_nome: employee.nome,
                  funcionario_id: employee.id,
                  // Garantir que temos os campos necessários
                  registro_id: record.registro_id || record.id || `${employee.id}_${record.data_hora}`,
                  tipo: record.tipo || 'entrada'
                }));
                
                allRecords = [...allRecords, ...recordsWithEmployeeInfo];
                console.log(`✅ Adicionados ${recordsWithEmployeeInfo.length} registros de ${employee.nome}`);
              } else {
                console.log(`⚠️ Nenhum registro individual encontrado para ${employee.nome}`);
              }
              
            } catch (empErr) {
              console.log(`❌ Erro geral ao buscar registros de ${employee.nome}:`, empErr);
            }
          }
          
          console.log('📊 Total de registros individuais coletados:', allRecords.length);
          console.log('📋 Exemplos dos primeiros 3 registros:', allRecords.slice(0, 3));
          
          // Se não conseguimos encontrar registros individuais, tentar endpoint direto
          if (allRecords.length === 0) {
            console.log('🔄 Tentando endpoints diretos para registros individuais...');
            
            const directEndpoints = [
              '/api/registros/individuais',
              '/api/time-records/individual', 
              '/api/records/detailed',
              '/api/pontos/todos'
            ];
            
            for (const endpoint of directEndpoints) {
              try {
                console.log(`📊 Tentando endpoint: ${endpoint}`);
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${endpoint}`, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json',
                  },
                });
                
                if (response.ok) {
                  const data = await response.json();
                  console.log(`✅ Resposta de ${endpoint}:`, data);
                  
                  let records = [];
                  if (Array.isArray(data)) {
                    records = data;
                  } else if (data.registros && Array.isArray(data.registros)) {
                    records = data.registros;
                  }
                  
                  if (records.length > 0 && records[0].data_hora && records[0].tipo) {
                    allRecords = records;
                    console.log(`✅ Encontrados ${allRecords.length} registros no endpoint ${endpoint}`);
                    break;
                  }
                }
              } catch (endpointError) {
                console.log(`❌ Erro no endpoint ${endpoint}:`, endpointError);
              }
            }
          }
          
          // Se ainda não temos registros, tentar buscar do endpoint padrão e verificar estrutura
          if (allRecords.length === 0) {
            console.log('🔄 Fallback: buscando do endpoint padrão...');
            const fallbackResponse = await apiService.getTimeRecords();
            console.log('📊 Resposta fallback:', fallbackResponse);
            
            if (Array.isArray(fallbackResponse)) {
              // Se já é um array, usar direto
              allRecords = fallbackResponse;
            } else if (fallbackResponse && typeof fallbackResponse === 'object') {
              // Procurar arrays em todas as propriedades
              Object.keys(fallbackResponse).forEach(key => {
                if (Array.isArray(fallbackResponse[key])) {
                  console.log(`📊 Encontrado array em ${key}:`, fallbackResponse[key].length);
                  allRecords = [...allRecords, ...fallbackResponse[key]];
                }
              });
            }
          }
          
        } catch (fetchError) {
          console.error('❌ Erro ao buscar registros individuais:', fetchError);
        }
        
        // Ordenar por data/hora mais recente primeiro (SEMPRE)
        if (allRecords.length > 0) {
          allRecords.sort((a, b) => {
            const dateA = new Date(a.data_hora || '1970-01-01');
            const dateB = new Date(b.data_hora || '1970-01-01');
            return dateB.getTime() - dateA.getTime(); // Mais recente primeiro
          });
          console.log('✅ Registros ordenados por data (mais recentes primeiro)');
          console.log('📅 Primeiro registro (mais recente):', allRecords[0]?.data_hora);
          console.log('📅 Último registro (mais antigo):', allRecords[allRecords.length - 1]?.data_hora);
        }
        
        // Aplicar filtros se especificados
        if ((dateFrom || dateTo || selectedEmployeeId) && allRecords.length > 0) {
          console.log('🔧 Aplicando filtros...');
          let filteredRecords = [...allRecords];
          
          if (selectedEmployeeId) {
            filteredRecords = filteredRecords.filter(record => 
              record.funcionario_id === selectedEmployeeId
            );
            console.log(`📊 Após filtro por funcionário: ${filteredRecords.length}`);
          }
          
          if (dateFrom || dateTo) {
            filteredRecords = filteredRecords.filter(record => {
              if (!record.data_hora) return false;
              
              const recordDate = record.data_hora.split(' ')[0] || 
                                record.data_hora.split('T')[0];
              
              if (dateFrom && recordDate < dateFrom) return false;
              if (dateTo && recordDate > dateTo) return false;
              
              return true;
            });
            console.log(`📊 Após filtro por data: ${filteredRecords.length}`);
          }
          
          // Reordenar após filtros para manter ordem cronológica
          filteredRecords.sort((a, b) => {
            const dateA = new Date(a.data_hora || '1970-01-01');
            const dateB = new Date(b.data_hora || '1970-01-01');
            return dateB.getTime() - dateA.getTime(); // Mais recente primeiro
          });
          
          allRecords = filteredRecords;
        }
        
        console.log('🎯 Registros finais para exibição:', allRecords.length);
        console.log('📋 Estrutura dos registros finais:', allRecords.length > 0 ? Object.keys(allRecords[0]) : 'Nenhum registro');
        
        setRecords(allRecords);
        setFilteredRecords(allRecords);
        
      } else {
        // Para resumo por funcionário, usar a lógica original
        const params: {
          inicio?: string;
          fim?: string;
          funcionario_id?: string;
        } = {};
        if (dateFrom) params.inicio = dateFrom;
        if (dateTo) params.fim = dateTo;
        if (selectedEmployeeId) params.funcionario_id = selectedEmployeeId;

        const response = await apiService.getTimeRecords(params);
        const summaries = Array.isArray(response) ? response : [];
        setEmployeeSummaries(summaries);
      }
    } catch (err: any) {
      console.error('❌ Erro geral ao buscar registros:', err);
      setError('Erro ao carregar registros. Tente novamente.');
      showSnackbar('Erro ao carregar registros', 'error');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, selectedEmployeeId, tabValue]);

  // Busca de funcionários conforme digita
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    
    if (!value.trim()) {
      setFilteredEmployees([]);
      setShowSuggestions(false);
      setSelectedEmployeeId('');
      return;
    }

    const filtered = employees.filter(emp =>
      emp.nome.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredEmployees(filtered.slice(0, 8));
    setShowSuggestions(true);
  }, [employees]);

  // Selecionar funcionário da lista de sugestões
  const handleEmployeeSelect = (employee: Employee) => {
    setSearchTerm(employee.nome);
    setSelectedEmployeeId(employee.id);
    setShowSuggestions(false);
  };

  // Navegar para página individual do funcionário
  const handleNavigateToEmployee = (employee: Employee) => {
    navigate(`/records/employee/${employee.id}/${encodeURIComponent(employee.nome)}`);
  };

  // Navegação via clique na tabela de resumo
  const handleClickFuncionario = (summary: EmployeeSummary) => {
    if (summary && summary.funcionario_id) {
      const funcionarioNome = summary.funcionario || summary.funcionario_nome || 'Funcionário';
      navigate(`/records/employee/${summary.funcionario_id}/${encodeURIComponent(funcionarioNome)}`);
    } else {
      showSnackbar('ID do funcionário não encontrado', 'error');
    }
  };

  // Limpar busca
  const handleClearSearch = () => {
    setSearchTerm('');
    setSelectedEmployeeId('');
    setFilteredEmployees([]);
    setShowSuggestions(false);
  };

  // Carregar funcionários
  const loadEmployees = async () => {
    try {
      const response = await apiService.getEmployees();
      const employeesList = response.funcionarios || [];
      setEmployees(employeesList.sort((a: Employee, b: Employee) => a.nome.localeCompare(b.nome)));
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  // Função para ajustar timezone brasileiro
  // Função para converter data/hora para string no formato correto para o servidor
  const formatDateTimeForServer = (date: Date): string => {
    // A data já vem no horário correto do Brasil do TimeRecordForm
    
    // Formato: yyyy-mm-dd hh:mm:ss
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // Criar registro manual - CORRIGIDO
  const handleCreateRecord = async (data: {
    funcionario_id: string;
    data_hora: string;
    tipo: 'entrada' | 'saída';
  }) => {
    try {
      setSubmitting(true);
      
      // Converter a data_hora recebida para objeto Date
      const inputDate = new Date(data.data_hora);
      
      // Verificar se a data é válida
      if (isNaN(inputDate.getTime())) {
        showSnackbar('Data/hora inválida', 'error');
        return;
      }
      
      // Formatar para o timezone correto do Brasil
      const correctedDateTime = formatDateTimeForServer(inputDate);
      
      console.log('🕐 Registrando ponto:', {
        original: data.data_hora,
        corrigido: correctedDateTime,
        funcionario: data.funcionario_id,
        tipo: data.tipo
      });
      
      // Enviar com a data/hora corrigida
      const correctedData = {
        ...data,
        data_hora: correctedDateTime
      };
      
      await apiService.registerTimeManual(correctedData);
      showSnackbar('Ponto registrado com sucesso!', 'success');
      setFormOpen(false);
      buscarRegistros();
    } catch (err: any) {
      console.error('Error creating record:', err);
      showSnackbar('Erro ao registrar ponto', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Excluir registro
  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;

    try {
      setSubmitting(true);
      await apiService.deleteTimeRecord(recordToDelete.registro_id);
      showSnackbar('Registro excluído com sucesso!', 'success');
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
      buscarRegistros();
    } catch (err: any) {
      console.error('Error deleting record:', err);
      showSnackbar('Erro ao excluir registro', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Exportar para Excel
  const exportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      if (tabValue === 0) {
        // Export do resumo
        const wsData = [
          ["Relatório de Horas Trabalhadas"],
          ["Período:", `${dateFrom || 'Não informado'} a ${dateTo || 'Não informado'}`],
          [],
          ["Funcionário", "Horas Trabalhadas"]
        ];
        
        employeeSummaries.forEach(summary => {
          wsData.push([
            summary.funcionario || summary.funcionario_nome || 'Desconhecido',
            formatHoursWorked(summary.horas_trabalhadas ?? summary.total_horas ?? 0)
          ]);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [{ wch: 30 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, ws, "Horas Trabalhadas");
        
        const fileName = `Horas_Trabalhadas_${dateFrom ? dateFrom.split('-').reverse().join('-') : 'inicio'}_a_${dateTo ? dateTo.split('-').reverse().join('-') : 'fim'}.xlsx`;
        XLSX.writeFile(wb, fileName);
        showSnackbar(`Relatório "${fileName}" gerado com sucesso!`, 'success');
      } else {
        // Export detalhado
        const wsData = [
          ["Relatório Detalhado de Registros"],
          ["Período:", `${dateFrom || 'Não informado'} a ${dateTo || 'Não informado'}`],
          [],
          ["Funcionário", "Data", "Hora", "Tipo", "ID Registro"]
        ];
        
        filteredRecords.forEach(record => {
          const { date, time } = formatDateTime(record.data_hora || '');
          wsData.push([
            record.funcionario_nome || record.funcionario_id || 'N/A',
            date,
            time,
            getStatusText(record.tipo || 'entrada'),
            record.registro_id || 'N/A'
          ]);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, ws, "Registros Detalhados");
        
        const fileName = `Registros_Detalhados_${dateFrom ? dateFrom.split('-').reverse().join('-') : 'inicio'}_a_${dateTo ? dateTo.split('-').reverse().join('-') : 'fim'}.xlsx`;
        XLSX.writeFile(wb, fileName);
        showSnackbar(`Relatório "${fileName}" gerado com sucesso!`, 'success');
      }
    } catch (err) {
      console.error('Erro ao exportar:', err);
      showSnackbar('Erro ao gerar relatório', 'error');
    }
  };

  // Funções auxiliares
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const formatDateTime = (dateTimeString: string) => {
    try {
      if (!dateTimeString) {
        return { date: 'N/A', time: 'N/A' };
      }
      
      // Criar objeto Date a partir da string
      let dateObj: Date;
      
      if (dateTimeString.includes('T')) {
        // ISO format: 2024-09-26T15:30:00.000Z
        dateObj = new Date(dateTimeString);
      } else if (dateTimeString.includes(' ')) {
        // Format: 2024-09-26 15:30:00 ou 26-09-2024 15:30:00
        if (dateTimeString.includes('-')) {
          const [datePart, timePart] = dateTimeString.split(' ');
          const parts = datePart.split('-');
          
          if (parts[0].length === 4) {
            // yyyy-mm-dd hh:mm:ss
            dateObj = new Date(dateTimeString);
          } else {
            // dd-mm-yyyy hh:mm:ss - converter para formato ISO
            const [day, month, year] = parts;
            const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${timePart}`;
            dateObj = new Date(isoDate);
          }
        } else {
          dateObj = new Date(dateTimeString);
        }
      } else {
        dateObj = new Date(dateTimeString);
      }
      
      // Verificar se a data é válida
      if (isNaN(dateObj.getTime())) {
        console.warn('Data inválida:', dateTimeString);
        return { date: dateTimeString, time: '' };
      }
      
      // Trabalhar diretamente com a data parseada
      
      const date = dateObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Sao_Paulo'
      });
      
      const time = dateObj.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });
      
      return { date, time };
    } catch (error) {
      console.error('Erro ao formatar data:', error, dateTimeString);
      return { date: dateTimeString, time: '' };
    }
  };

  const getStatusColor = (tipo: string) => {
    return tipo === 'entrada' ? 'success' : 'error';
  };

  const getStatusText = (tipo: string) => {
    return tipo === 'entrada' ? 'Entrada' : 'Saída';
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    handleClearSearch();
    clearSorting();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Effects
  useEffect(() => {
    // Apply filters from URL params (when coming from dashboard)
    const dateParam = searchParams.get('date');
    const tabParam = searchParams.get('tab');
    
    if (dateParam) {
      setDateFrom(dateParam);
      setDateTo(dateParam);
      setTabValue(1); // Switch to detailed records tab
    }
    
    if (tabParam === 'detailed') {
      setTabValue(1); // Switch to detailed records tab without date filter
    }
  }, [searchParams]);

  useEffect(() => {
    buscarRegistros();
  }, [buscarRegistros]);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (tabValue === 1) {
      // Função para parsing de datas brasileiras
      const parseDate = (dateStr: string) => {
        if (!dateStr) return new Date('1970-01-01');
        
        let datePart, timePart = '';
        if (dateStr.includes(' ')) {
          [datePart, timePart] = dateStr.split(' ');
        } else {
          datePart = dateStr;
        }
        
        if (datePart.includes('-') || datePart.includes('/')) {
          const separator = datePart.includes('-') ? '-' : '/';
          const parts = datePart.split(separator);
          
          if (parts.length === 3) {
            let day, month, year;
            
            if (parts[0].length === 4) {
              [year, month, day] = parts;
            } else {
              [day, month, year] = parts;
            }
            
            const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            return new Date(`${isoDate}${timePart ? ` ${timePart}` : ' 00:00:00'}`);
          }
        }
        
        return new Date(dateStr);
      };

      // Filtrar registros para aba detalhada baseado na busca de texto
      let filtered = [...records];

      if (searchTerm.trim() && !selectedEmployeeId) {
        filtered = filtered.filter(record =>
          record.funcionario_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.registro_id.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // SEMPRE aplicar ordenação
      if (sortBy === 'data' && sortOrder === 'desc') {
        // Ordenação padrão por data mais recente primeiro
        filtered.sort((a, b) => {
          try {
            const dateA = parseDate(a.data_hora || '1970-01-01');
            const dateB = parseDate(b.data_hora || '1970-01-01');
            
            const timestampA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
            const timestampB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
            
            return timestampB - timestampA; // Mais recente primeiro
          } catch (error) {
            console.warn('Erro na ordenação padrão:', error);
            return 0;
          }
        });
      } else {
        // Aplicar ordenação personalizada
        filtered = getSortedRecords(filtered);
      }
      
      setFilteredRecords(filtered);
      
      console.log('🔍 Filtros aplicados e registros ordenados:', {
        busca: searchTerm,
        funcionario: selectedEmployeeId,
        totalRegistros: records.length,
        totalFiltrados: filtered.length,
        ordenacao: `${sortBy} ${sortOrder}`,
        primeiroRegistro: filtered[0]?.data_hora,
        ultimoRegistro: filtered[filtered.length - 1]?.data_hora
      });
    }
  }, [records, searchTerm, selectedEmployeeId, tabValue, sortBy, sortOrder]);

  // Effect para garantir ordenação inicial
  useEffect(() => {
    if (records.length > 0 && tabValue === 1) {
      // SEMPRE ordenar por data desc (mais recente primeiro) ao carregar os dados
      const sortedByDate = [...records].sort((a, b) => {
        try {
          // Função para converter data brasileira para formato ISO
          const parseDate = (dateStr: string) => {
            if (!dateStr) return new Date('1970-01-01');
            
            // Se contém espaço, separar data e hora
            let datePart, timePart = '';
            if (dateStr.includes(' ')) {
              [datePart, timePart] = dateStr.split(' ');
            } else {
              datePart = dateStr;
            }
            
            // Se está no formato dd-mm-yyyy ou dd/mm/yyyy
            if (datePart.includes('-') || datePart.includes('/')) {
              const separator = datePart.includes('-') ? '-' : '/';
              const parts = datePart.split(separator);
              
              if (parts.length === 3) {
                let day, month, year;
                
                if (parts[0].length === 4) {
                  // yyyy-mm-dd
                  [year, month, day] = parts;
                } else {
                  // dd-mm-yyyy ou dd/mm/yyyy
                  [day, month, year] = parts;
                }
                
                // Criar data ISO (yyyy-mm-dd hh:mm:ss)
                const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                return new Date(`${isoDate}${timePart ? ` ${timePart}` : ' 00:00:00'}`);
              }
            }
            
            // Fallback para formato padrão
            return new Date(dateStr);
          };
          
          const dateA = parseDate(a.data_hora || '1970-01-01');
          const dateB = parseDate(b.data_hora || '1970-01-01');
          
          // Verificar se as datas são válidas
          const timestampA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
          const timestampB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
          
          const comparison = timestampB - timestampA; // Mais recente primeiro
          
          console.log(`📅 Comparando: ${a.data_hora} (${timestampA}) vs ${b.data_hora} (${timestampB}) = ${comparison}`);
          return comparison;
        } catch (error) {
          console.warn('Erro ao comparar datas:', error, a.data_hora, b.data_hora);
          return 0;
        }
      });
      
      // Definir estados de ordenação para refletir a ordenação atual
      setSortBy('data');
      setSortOrder('desc');
      
      setFilteredRecords(sortedByDate);
      console.log('📅 FORÇA ordenação inicial - mais recente primeiro');
      console.log('🔍 Primeiro registro após ordenação:', sortedByDate[0]?.data_hora);
      console.log('🔍 Último registro após ordenação:', sortedByDate[sortedByDate.length - 1]?.data_hora);
      console.log('🔍 Total de registros ordenados:', sortedByDate.length);
    }
  }, [records, tabValue]);

  // Função atualizada para formatar horas trabalhadas - INCLUINDO MINUTOS
  const formatHoursWorked = (horasValue: number | string): string => {
    console.log('🕐 formatHoursWorked recebeu:', horasValue, 'tipo:', typeof horasValue);
    
    // Se é um número decimal (ex: 8.5 horas = 8h 30min)
    if (typeof horasValue === 'number') {
      if (horasValue === 0) return '00:00';
      
      const hours = Math.floor(horasValue);
      const decimalPart = horasValue - hours;
      const minutes = Math.round(decimalPart * 60);
      
      const result = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      console.log('🕐 formatHoursWorked (number) retornando:', result);
      return result;
    }
    
    // Se já é uma string no formato correto HH:MM, retornar
    if (typeof horasValue === 'string' && horasValue.match(/^\d{1,3}:\d{2}$/)) {
      return horasValue;
    }
    
    // Se é uma string que contém "day", extrair e converter corretamente
    if (typeof horasValue === 'string' && horasValue.includes('day')) {
      console.log('🕐 Processando string com days:', horasValue);
      
      let totalMinutes = 0;
      
      // Extrair dias se existir
      const dayMatch = horasValue.match(/(\d+)\s*day/);
      if (dayMatch) {
        const days = parseInt(dayMatch[1]);
        totalMinutes += days * 24 * 60; // Converter dias para minutos
        console.log('🕐 Dias encontrados:', days, 'minutos dos dias:', days * 24 * 60);
      }
      
      // Extrair horas e minutos se existir (formato HH:MM:SS ou HH:MM)
      const timeMatch = horasValue.match(/(\d+):(\d+)(?::(\d+))?/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        totalMinutes += (hours * 60) + minutes;
        console.log('🕐 Tempo adicional encontrado:', hours, 'h', minutes, 'm');
      }
      
      // Converter total de minutos para formato HH:MM
      const finalHours = Math.floor(totalMinutes / 60);
      const finalMinutes = totalMinutes % 60;
      const result = `${finalHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
      
      console.log('🕐 Resultado final para string com days:', result, 'total minutos:', totalMinutes);
      return result;
    }
    
    // Se é uma string numérica, converter
    if (typeof horasValue === 'string') {
      const numValue = parseFloat(horasValue);
      if (!isNaN(numValue)) {
        const hours = Math.floor(numValue);
        const decimalPart = numValue - hours;
        const minutes = Math.round(decimalPart * 60);
        
        const result = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        console.log('🕐 formatHoursWorked (string numérica) retornando:', result);
        return result;
      }
    }
    
    console.log('🕐 formatHoursWorked retornando valor padrão: 00:00');
    return '00:00';
  };

  return (
    <PageLayout>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { sm: 'center' },
        justifyContent: 'space-between',
        gap: 2,
        mb: 4
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 600, 
                color: 'white', 
                mb: 1,
                fontSize: '28px'
              }}
            >
              Registros de Ponto
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '16px'
              }}
            >
              Visualize e gerencie os registros de ponto dos funcionários
            </Typography>
          </Box>
        </motion.div>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={exportToExcel}
            disabled={(tabValue === 0 ? employeeSummaries.length : filteredRecords.length) === 0 || loading}
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: 'rgba(255, 255, 255, 0.8)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
              }
            }}
          >
            Exportar Excel
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setFormOpen(true)}
            sx={{
              background: '#3b82f6',
              '&:hover': {
                background: '#2563eb',
              },
              fontWeight: 600,
              textTransform: 'none',
            }}
          >
            Registro Manual
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {error}
        </Alert>
      )}

      {/* Busca Unificada de Funcionários */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card 
          sx={{
            mb: 3,
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
          }}
        >
          <CardContent>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                mb: 2,
                color: 'white',
                fontSize: '18px'
              }}
            >
              Buscar Funcionários
            </Typography>
            
            <Box sx={{ position: 'relative' }}>
              <TextField
                fullWidth
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => {
                  if (searchTerm && filteredEmployees.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => {
                  // Delay para permitir clique nas sugestões
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                placeholder="Digite o nome do funcionário..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleClearSearch}
                        edge="end"
                        size="small"
                        sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3b82f6',
                    },
                  },
                }}
                sx={{
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.6)',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(255, 255, 255, 0.5)',
                    opacity: 1,
                  },
                }}
              />

              {/* Sugestões de Funcionários */}
              <Collapse in={showSuggestions && filteredEmployees.length > 0}>
                <Paper
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 1000,
                      mt: 1,
                      background: 'rgba(30, 41, 138, 0.95)',
                      backdropFilter: 'blur(20px)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      maxHeight: '300px',
                      overflow: 'auto',
                    }}
                  >
                    <List sx={{ py: 0 }}>
                    {filteredEmployees.map((employee) => (
                      <ListItem
                        key={employee.id}
                        disablePadding
                        sx={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          '&:last-child': {
                            borderBottom: 'none',
                          },
                        }}
                      >
                        <ListItemButton
                          onClick={() => handleEmployeeSelect(employee)}
                          onDoubleClick={() => handleNavigateToEmployee(employee)}
                          sx={{
                            '&:hover': {
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ backgroundColor: '#3b82f6', width: 32, height: 32 }}>
                              <PersonIcon sx={{ fontSize: 18 }} />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography sx={{ color: 'white', fontWeight: 500 }}>
                                {employee.nome}
                              </Typography>
                            }
                            secondary={
                              <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
                                ID: {employee.id.slice(0, 8)}... • Clique duplo para ver registros
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Collapse>
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <RecordsTabs
        tabValue={tabValue}
        onTabChange={handleTabChange}
      />

      {/* Filtros Simplificados */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card 
          sx={{
            mb: 3,
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <CardContent>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                mb: 3,
                color: 'white',
                fontSize: '18px'
              }}
            >
              Filtros por Data
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <TextField
                type="date"
                label="Data Início"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  minWidth: 200,
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6)' },
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                  },
                }}
              />
              
              <TextField
                type="date"
                label="Data Fim"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  minWidth: 200,
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6)' },
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                  },
                }}
              />
              
              <Button
                variant="outlined"
                onClick={clearFilters}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  }
                }}
              >
                Limpar Filtros
              </Button>
              
              {(sortBy !== 'data' || sortOrder !== 'desc') && (
                <Button
                  variant="outlined"
                  onClick={clearSorting}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    }
                  }}
                >
                  Limpar Ordenação
                </Button>
              )}
            </Box>
            
            {/* Indicador de ordenação atual */}
            {(sortBy !== 'data' || sortOrder !== 'desc') && (
              <Box sx={{ mt: 2, mb: 1 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  Ordenado por: {' '}
                  <span style={{ color: '#3b82f6', fontWeight: 500 }}>
                    {sortBy === 'funcionario' ? 'Funcionário' : 
                     sortBy === 'data' ? 'Data' : 'Status'}
                  </span>
                  {' '}({sortOrder === 'asc' ? 'crescente' : 'decrescente'})
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Conteúdo principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card 
          sx={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <CardContent>
            {tabValue === 0 ? (
              // Resumo por funcionário
              <>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600, 
                    mb: 3,
                    color: 'white',
                    fontSize: '18px'
                  }}
                >
                  Resumo por Funcionário ({employeeSummaries.length})
                </Typography>
                
                <TableContainer 
                  component={Paper} 
                  variant="outlined"
                  sx={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                          Funcionário
                        </TableCell>
                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                          Horas Trabalhadas
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {employeeSummaries.length > 0 ? (
                        employeeSummaries.map((summary, index) => (
                          <TableRow key={index} hover>
                            <TableCell
                              sx={{ 
                                cursor: 'pointer', 
                                color: '#3b82f6',
                                '&:hover': { 
                                  textDecoration: 'underline',
                                  color: '#60a5fa'
                                }
                              }}
                              onClick={() => handleClickFuncionario(summary)}
                            >
                              {summary.funcionario || summary.funcionario_nome || 'Desconhecido'}
                            </TableCell>
                            <TableCell sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                {formatHoursWorked(summary.horas_trabalhadas ?? summary.total_horas ?? 0)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell 
                            colSpan={2} 
                            align="center"
                            sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
                          >
                            <Box sx={{ py: 8 }}>
                              <AccessTimeIcon sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '4rem', mb: 2 }} />
                              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 1 }}>
                                Nenhum resumo encontrado
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                {selectedEmployeeId || dateFrom || dateTo 
                                  ? 'Nenhum registro encontrado com os filtros aplicados' 
                                  : 'Ajuste os filtros ou registre o primeiro ponto'}
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              // Registros detalhados
              <>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600, 
                    mb: 3,
                    color: 'white',
                    fontSize: '18px'
                  }}
                >
                  Registros Detalhados ({filteredRecords.length})
                </Typography>
                
                <TableContainer 
                  component={Paper} 
                  variant="outlined"
                  sx={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell 
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.9)', 
                            fontWeight: 600,
                            cursor: 'pointer',
                            userSelect: 'none',
                            '&:hover': {
                              color: '#3b82f6',
                              background: 'rgba(59, 130, 246, 0.05)'
                            }
                          }}
                          onClick={() => handleSort('funcionario')}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            Funcionário
                            {sortBy === 'funcionario' && (
                              <Typography variant="body2" sx={{ color: '#3b82f6' }}>
                                {sortOrder === 'asc' ? '↑' : '↓'}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.9)', 
                            fontWeight: 600,
                            cursor: 'pointer',
                            userSelect: 'none',
                            '&:hover': {
                              color: '#3b82f6',
                              background: 'rgba(59, 130, 246, 0.05)'
                            }
                          }}
                          onClick={() => handleSort('data')}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            Data
                            {sortBy === 'data' && (
                              <Typography variant="body2" sx={{ color: '#3b82f6' }}>
                                {sortOrder === 'asc' ? '↑' : '↓'}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                          Hora
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.9)', 
                            fontWeight: 600,
                            cursor: 'pointer',
                            userSelect: 'none',
                            '&:hover': {
                              color: '#3b82f6',
                              background: 'rgba(59, 130, 246, 0.05)'
                            }
                          }}
                          onClick={() => handleSort('status')}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            Status
                            {sortBy === 'status' && (
                              <Typography variant="body2" sx={{ color: '#3b82f6' }}>
                                {sortOrder === 'asc' ? '↑' : '↓'}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                          Ações
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredRecords.length > 0 ? (
                        filteredRecords.map((record, index) => {
                          const { date, time } = formatDateTime(record.data_hora || '');
                          return (
                            <TableRow key={record.registro_id || `record-${index}`} hover>
                              <TableCell>
                                <Box>
                                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                                    {record.funcionario_nome || record.funcionario_id || 'N/A'}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                    ID: {record.registro_id?.slice(0, 8) || record.funcionario_id?.slice(0, 8) || 'N/A'}...
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                                  {date}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                                  {time}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={getStatusText(record.tipo || 'entrada')}
                                  color={getStatusColor(record.tipo || 'entrada') as any}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="center">
                                <IconButton
                                  onClick={() => {
                                    if (record.registro_id) {
                                      setRecordToDelete(record);
                                      setDeleteDialogOpen(true);
                                    } else {
                                      showSnackbar('Não é possível excluir este registro', 'error');
                                    }
                                  }}
                                  size="small"
                                  sx={{
                                    color: '#ef4444',
                                    '&:hover': {
                                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    }
                                  }}
                                  disabled={!record.registro_id}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Box sx={{ py: 8 }}>
                              <AccessTimeIcon sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '4rem', mb: 2 }} />
                              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 1 }}>
                                Nenhum registro encontrado
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                Ajuste os filtros ou registre o primeiro ponto
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Time Record Form Dialog */}
      <TimeRecordForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreateRecord}
        loading={submitting}
        employees={employees}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: { 
            borderRadius: 2,
            background: 'rgba(30, 41, 138, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white'
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
            Confirmar Exclusão
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Tem certeza que deseja excluir este registro de ponto?
          </Typography>
          <Typography variant="body2" sx={{ color: '#ef4444', mt: 2 }}>
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={submitting}
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              }
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteRecord}
            color="error"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
            sx={{
              backgroundColor: '#ef4444',
              '&:hover': {
                backgroundColor: '#dc2626',
              }
            }}
          >
            {submitting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </PageLayout>
  );
};

// Função para limpar ordenação
const clearSorting = () => {
  setSortBy('data');
  setSortOrder('desc');
};

// Função para lidar com ordenação
const handleSort = (column: 'funcionario' | 'data' | 'status') => {
  if (sortBy === column) {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  } else {
    setSortBy(column);
    setSortOrder('asc');
  }
};

// Função para obter registros ordenados
const getSortedRecords = (filtered: TimeRecord[]): TimeRecord[] => {
  return [...filtered].sort((a, b) => {
    let compareValue = 0;
    
    switch (sortBy) {
      case 'funcionario':
        const nameA = (a.funcionario_nome || a.funcionario_id || '').toLowerCase();
        const nameB = (b.funcionario_nome || b.funcionario_id || '').toLowerCase();
        compareValue = nameA.localeCompare(nameB);
        break;
        
      case 'data':
        const dateA = new Date(a.data_hora || '1970-01-01');
        const dateB = new Date(b.data_hora || '1970-01-01');
        compareValue = dateA.getTime() - dateB.getTime();
        break;
        
      case 'status':
        const statusA = (a.tipo || 'entrada').toLowerCase();
        const statusB = (b.tipo || 'entrada').toLowerCase();
        compareValue = statusA.localeCompare(statusB);
        break;
        
      default:
        return 0;
    }
    
    return sortOrder === 'asc' ? compareValue : -compareValue;
  });
}

export default RecordsPage;

