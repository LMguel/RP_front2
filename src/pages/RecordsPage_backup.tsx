// RecordsPage.tsx - Versão melhorada inspirada no Registros.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PageLayout from '../sections/PageLayout';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Autocomplete,
  Snackbar,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Fade,
  Slide,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  AccessTime as AccessTimeIcon,
  FileDownload as FileDownloadIcon,
  FilterList as FilterListIcon,
  Person as PersonIcon,
  History as HistoryIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { TimeRecord, Employee } from '../types';
import TimeRecordForm from '../components/TimeRecordForm';
import * as XLSX from 'xlsx';

interface EmployeeSummary {
  funcionario_id: string;
  funcionario: string;
  funcionario_nome: string;
  horas_trabalhadas: number;
  total_horas: number;
  dias?: {
    [date: string]: Array<{
      hora: string;
      tipo: string;
    }>;
  };
}

interface EmployeeWithRecords extends Employee {
  registros?: TimeRecord[];
  totalHoras?: string;
  ultimoRegistro?: TimeRecord;
}

const RecordsPage: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0); // 0 = Resumo, 1 = Detalhado, 2 = Histórico Individual
  const [employeeSummaries, setEmployeeSummaries] = useState<EmployeeSummary[]>([]);
  const [selectedEmployeeRecords, setSelectedEmployeeRecords] = useState<TimeRecord[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithRecords | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<TimeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para busca fluida
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  
  // Estados para filtros
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('');
  
  // Estados para dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<TimeRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailDestino, setEmailDestino] = useState('');
  const [emailEnviando, setEmailEnviando] = useState(false);
  
  // Estados para autocomplete
  const [nome, setNome] = useState('');
  const [opcoesNomes, setOpcoesNomes] = useState<string[]>([]);
  
  // Estados para snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  // Função para buscar registros (mantendo a lógica original)
  const buscarRegistros = useCallback(async () => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setError('A data de início não pode ser maior que a data de fim.');
      setEmployeeSummaries([]);
      setRecords([]);
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const params: {
        inicio?: string;
        fim?: string;
        nome?: string;
        funcionario_id?: string;
      } = {};
      if (dateFrom) params.inicio = dateFrom;
      if (dateTo) params.fim = dateTo;
      if (nome) params.nome = nome;
      if (selectedEmployeeFilter) params.funcionario_id = selectedEmployeeFilter;

      const response = await apiService.getTimeRecords(params);
      
      if (tabValue === 0) {
        const summaries = Array.isArray(response) ? response : [];
        setEmployeeSummaries(summaries);
      } else {
        const records = Array.isArray(response) ? response : [];
        setRecords(records);
        setFilteredRecords(records);
      }
    } catch (err: any) {
      console.error('Erro ao buscar registros:', err);
      setError('Erro ao carregar registros. Tente novamente.');
      showSnackbar('Erro ao carregar registros', 'error');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, nome, selectedEmployeeFilter, tabValue]);

  // Função para buscar registros de um funcionário específico
  const buscarRegistrosFuncionario = async (funcionarioId: string, funcionarioNome: string) => {
    try {
      setLoading(true);
      const params: any = { funcionario_id: funcionarioId };
      
      if (dateFrom) params.inicio = dateFrom;
      if (dateTo) params.fim = dateTo;

      const response = await apiService.getTimeRecords(params);
      const records = Array.isArray(response) ? response : [];
      
      // Ordenar registros por data mais recente primeiro
      const sortedRecords = records.sort((a, b) => 
        new Date(b.data_hora || '').getTime() - new Date(a.data_hora || '').getTime()
      );
      
      setSelectedEmployeeRecords(sortedRecords);
      setSelectedEmployee({
        id: funcionarioId,
        nome: funcionarioNome,
        registros: sortedRecords,
        totalHoras: calcularTotalHoras(sortedRecords),
        ultimoRegistro: sortedRecords[0]
      });
      
      setTabValue(2); // Mudar para aba de histórico individual
      
    } catch (err: any) {
      console.error('Erro ao buscar registros do funcionário:', err);
      showSnackbar('Erro ao carregar histórico do funcionário', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Função para calcular total de horas trabalhadas
  const calcularTotalHoras = (registros: TimeRecord[]): string => {
    if (registros.length === 0) return '00:00';
    
    let totalSegundos = 0;
    let entrada: Date | null = null;
    
    // Ordenar por data/hora para calcular corretamente
    const registrosOrdenados = [...registros].sort((a, b) => 
      new Date(a.data_hora || '').getTime() - new Date(b.data_hora || '').getTime()
    );
    
    registrosOrdenados.forEach(reg => {
      try {
        const dataHora = new Date(reg.data_hora || '');
        
        if (reg.tipo === 'entrada') {
          entrada = dataHora;
        } else if (reg.tipo === 'saída' && entrada) {
          totalSegundos += (dataHora.getTime() - entrada.getTime()) / 1000;
          entrada = null;
        }
      } catch (error) {
        console.error('Erro ao processar registro:', error);
      }
    });
    
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
  };

  // Busca fluida de funcionários
  const handleEmployeeSearchChange = useCallback((value: string) => {
    setEmployeeSearchTerm(value);
    
    if (!value.trim()) {
      setFilteredEmployees([]);
      setShowEmployeeSuggestions(false);
      return;
    }

    const filtered = employees.filter(emp =>
      emp.nome.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredEmployees(filtered.slice(0, 8)); // Mostrar até 8 sugestões
    setShowEmployeeSuggestions(true);
  }, [employees]);

  // Função para selecionar funcionário da busca
  const handleEmployeeSelect = (employee: Employee) => {
    setEmployeeSearchTerm(employee.nome);
    setShowEmployeeSuggestions(false);
    buscarRegistrosFuncionario(employee.id, employee.nome);
  };

  // Função para limpar seleção de funcionário
  const clearEmployeeSelection = () => {
    setSelectedEmployee(null);
    setSelectedEmployeeRecords([]);
    setEmployeeSearchTerm('');
    setTabValue(0);
  };

  // Função para exportar histórico do funcionário específico
  const exportEmployeeHistory = () => {
    if (!selectedEmployee) return;

    try {
      const wb = XLSX.utils.book_new();
      
      // Dados para o worksheet
      const wsData = [
        [`Histórico de Registros - ${selectedEmployee.nome}`],
        ["Período:", `${dateFrom || 'Não informado'} a ${dateTo || 'Não informado'}`],
        ["Total de Registros:", selectedEmployeeRecords.length],
        ["Total de Horas Trabalhadas:", selectedEmployee.totalHoras || '00:00'],
        [],
        ["Data", "Hora", "Tipo", "ID Registro"]
      ];
      
      selectedEmployeeRecords.forEach(record => {
        const { date, time } = formatDateTime(record.data_hora || '');
        wsData.push([
          date,
          time,
          getStatusText(record.tipo || 'entrada'),
          record.registro_id || 'N/A'
        ]);
      });
      
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 }
      ];
      XLSX.utils.book_append_sheet(wb, ws, "Histórico");
      
      const fileName = `Historico_${selectedEmployee.nome.replace(/\s+/g, '_')}_${dateFrom ? dateFrom.split('-').reverse().join('-') : 'inicio'}_a_${dateTo ? dateTo.split('-').reverse().join('-') : 'fim'}.xlsx`;
      XLSX.writeFile(wb, fileName);
      showSnackbar(`Histórico de ${selectedEmployee.nome} exportado com sucesso!`, 'success');
    } catch (err) {
      console.error('Erro ao exportar:', err);
      showSnackbar('Erro ao gerar relatório', 'error');
    }
  };

  // Função para enviar por email (simulação como no código original)
  const enviarPorEmail = async () => {
    if (!emailDestino || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDestino)) {
      showSnackbar('Por favor, insira um email válido', 'error');
      return;
    }

    if (!selectedEmployee) return;

    setEmailEnviando(true);
    try {
      // Simular envio como no código original
      console.log(`Enviando relatório de ${selectedEmployee.nome} para ${emailDestino}`);
      
      // Aqui você pode implementar a chamada real da API quando necessário
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simular delay
      
      showSnackbar('Relatório enviado com sucesso!', 'success');
      setEmailDialogOpen(false);
      setEmailDestino('');
    } catch (err) {
      console.error('Erro ao enviar email:', err);
      showSnackbar('Erro ao enviar relatório', 'error');
    } finally {
      setEmailEnviando(false);
    }
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

  // Outras funções (mantendo as originais)
  const handleCreateRecord = async (data: {
    funcionario_id: string;
    data_hora: string;
    tipo: 'entrada' | 'saída';
  }) => {
    try {
      setSubmitting(true);
      await apiService.registerTimeManual(data);
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

  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;

    try {
      setSubmitting(true);
      await apiService.deleteTimeRecord(recordToDelete.registro_id);
      showSnackbar('Registro excluído com sucesso!', 'success');
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
      buscarRegistros();
      
      // Se estiver na aba de histórico individual, atualizar também
      if (tabValue === 2 && selectedEmployee) {
        buscarRegistrosFuncionario(selectedEmployee.id, selectedEmployee.nome);
      }
    } catch (err: any) {
      console.error('Error deleting record:', err);
      showSnackbar('Erro ao excluir registro', 'error');
    } finally {
      setSubmitting(false);
    }
  };

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
            String(summary.horas_trabalhadas ?? summary.total_horas ?? 'N/A')
          ]);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [
          { wch: 30 },
          { wch: 20 }
        ];
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
        ws['!cols'] = [
          { wch: 30 },
          { wch: 15 },
          { wch: 15 },
          { wch: 15 },
          { wch: 20 }
        ];
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
      
      let date, time;
      
      if (dateTimeString.includes(' ')) {
        [date, time] = dateTimeString.split(' ');
      } else if (dateTimeString.includes('T')) {
        [date, time] = dateTimeString.split('T');
        time = time.split('.')[0];
      } else {
        return { date: dateTimeString, time: '' };
      }
      
      if (date.includes('-')) {
        const parts = date.split('-');
        if (parts[0].length === 4) {
          const [year, month, day] = parts;
          date = `${day}/${month}/${year}`;
        } else {
          const [day, month, year] = parts;
          date = `${day}/${month}/${year}`;
        }
      }
      
      return { date, time: time || '' };
    } catch (error) {
      console.error('Error formatting date:', error, dateTimeString);
      return { date: dateTimeString, time: '' };
    }
  };

  const getStatusColor = (tipo: string) => {
    return tipo === 'entrada' ? 'success' : 'error';
  };

  const getStatusText = (tipo: string) => {
    return tipo === 'entrada' ? 'Entrada' : 'Saída';
  };

  const handleClickFuncionario = (summary: EmployeeSummary) => {
    if (summary && summary.funcionario_id) {
      const funcionarioNome = summary.funcionario || summary.funcionario_nome || '';
      buscarRegistrosFuncionario(summary.funcionario_id, funcionarioNome);
    } else {
      showSnackbar('ID do funcionário não encontrado', 'error');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setNome('');
    setSelectedEmployeeFilter('');
    setEmployeeSearchTerm('');
    setShowEmployeeSuggestions(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Effects
  useEffect(() => {
    buscarRegistros();
  }, [buscarRegistros]);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (tabValue === 1) {
      // Filtrar registros para aba detalhada
      let filtered = [...records];

      if (searchTerm.trim()) {
        filtered = filtered.filter(record =>
          record.funcionario_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.registro_id.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (selectedEmployeeFilter) {
        filtered = filtered.filter(record => record.funcionario_id === selectedEmployeeFilter);
      }

      if (dateFrom) {
        filtered = filtered.filter(record => record.data_hora >= dateFrom);
      }

      if (dateTo) {
        filtered = filtered.filter(record => record.data_hora <= dateTo + ' 23:59:59');
      }

      setFilteredRecords(filtered);
    }
  }, [records, searchTerm, selectedEmployeeFilter, dateFrom, dateTo, tabValue]);

  // Componente de sugestões de funcionários
  const EmployeeSuggestions = () => (
    <AnimatePresence>
      {showEmployeeSuggestions && filteredEmployees.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <Paper
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1000,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              maxHeight: '300px',
              overflowY: 'auto',
              mt: 1,
            }}
          >
            <List disablePadding>
              {filteredEmployees.map((employee, index) => (
                <ListItem key={employee.id} disablePadding>
                  <ListItemButton
                    onClick={() => handleEmployeeSelect(employee)}
                    sx={{
                      padding: '12px 16px',
                      borderBottom: index < filteredEmployees.length - 1 ? '1px solid rgba(0, 0, 0, 0.1)' : 'none',
                      '&:hover': {
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      }
                    }}
                  >
                    <PersonIcon sx={{ color: '#64748b', mr: 2 }} />
                    <ListItemText
                      primary={employee.nome}
                      primaryTypographyProps={{
                        color: '#1f2937',
                        fontWeight: 500,
                        fontSize: '14px'
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (loading && !selectedEmployee) {
    return (
      <PageLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress sx={{ color: 'white' }} />
        </Box>
      </PageLayout>
    );
  }

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {selectedEmployee && (
              <IconButton
                onClick={clearEmployeeSelection}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  }
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
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
                {selectedEmployee ? `Registros de ${selectedEmployee.nome}` : 'Registros de Ponto'}
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '16px'
                }}
              >
                {selectedEmployee 
                  ? `Total de horas: ${selectedEmployee.totalHoras || '00:00'}`
                  : 'Visualize e gerencie os registros de ponto dos funcionários'
                }
              </Typography>
            </Box>
          </Box>
        </motion.div>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {selectedEmployee && (
            <>
              <Button
                variant="outlined"
                startIcon={<EmailIcon />}
                onClick={() => setEmailDialogOpen(true)}
                disabled={selectedEmployeeRecords.length === 0}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                  }
                }}
              >
                Enviar Email
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={exportEmployeeHistory}
                disabled={selectedEmployeeRecords.length === 0}
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
            </>
          )}
          {!selectedEmployee && (
            <>
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
            </>
          )}
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

      {/* Barra de busca por funcionário - só aparece quando não há funcionário selecionado */}
      {!selectedEmployee && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card 
            sx={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              mb: 3
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HistoryIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', mr: 2 }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'white',
                    fontWeight: 500,
                    fontSize: '16px'
                  }}
                >
                  Buscar Histórico Individual
                </Typography>
              </Box>
              
              <Box sx={{ position: 'relative' }}>
                <TextField
                  fullWidth
                  placeholder="Digite o nome do funcionário para ver seu histórico..."
                  value={employeeSearchTerm}
                  onChange={(e) => handleEmployeeSearchChange(e.target.value)}
                  onBlur={() => {
                    setTimeout(() => setShowEmployeeSuggestions(false), 200);
                  }}
                  onFocus={() => {
                    if (employeeSearchTerm && filteredEmployees.length > 0) {
                      setShowEmployeeSuggestions(true);
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                      </InputAdornment>
                    ),
                    endAdornment: employeeSearchTerm && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEmployeeSearchTerm('');
                            setShowEmployeeSuggestions(false);
                          }}
                          sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        >
                          <CloseIcon />
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
                        borderColor: 'rgba(59, 130, 246, 0.8)',
                      },
                      '& input::placeholder': {
                        color: 'rgba(255, 255, 255, 0.6)',
                        opacity: 1,
                      },
                      background: 'rgba(255, 255, 255, 0.05)',
                    }
                  }}
                  variant="outlined"
                />
                <EmployeeSuggestions />
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tabs - só aparecem quando não há funcionário selecionado */}
      {!selectedEmployee && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
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
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                sx={{ 
                  mb: 2,
                  '& .MuiTab-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: 500,
                    textTransform: 'none',
                    '&.Mui-selected': {
                      color: 'white',
                    }
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#3b82f6',
                  }
                }}
              >
                <Tab label="Resumo por Funcionário" />
                <Tab label="Registros Detalhados" />
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filtros - só aparecem quando não há funcionário selecionado */}
      {!selectedEmployee && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card 
            sx={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              mb: 4
            }}
          >
            <CardContent>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  {tabValue === 0 ? (
                    <TextField
                      fullWidth
                      placeholder="Buscar por funcionário..."
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
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
                            borderColor: 'rgba(255, 255, 255, 0.7)',
                          },
                          '& input::placeholder': {
                            color: 'rgba(255, 255, 255, 0.6)',
                            opacity: 1,
                          },
                          background: 'rgba(255, 255, 255, 0.05)',
                        }
                      }}
                      variant="outlined"
                    />
                  ) : (
                    <TextField
                      fullWidth
                      placeholder="Buscar por funcionário ou ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
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
                            borderColor: 'rgba(255, 255, 255, 0.7)',
                          },
                          '& input::placeholder': {
                            color: 'rgba(255, 255, 255, 0.6)',
                            opacity: 1,
                          },
                          background: 'rgba(255, 255, 255, 0.05)',
                        }
                      }}
                      variant="outlined"
                    />
                  )}
                </Grid>
                
                <Grid size={{ xs: 12, md: 3 }}>
                  <FormControl 
                    fullWidth
                    sx={{
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&.Mui-focused': {
                          color: 'rgba(255, 255, 255, 0.9)'
                        }
                      },
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.5)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.7)',
                        },
                        background: 'rgba(255, 255, 255, 0.05)',
                      },
                      '& .MuiSelect-icon': {
                        color: 'rgba(255, 255, 255, 0.7)'
                      }
                    }}
                  >
                    <InputLabel>Funcionário</InputLabel>
                    <Select
                      value={selectedEmployeeFilter}
                      onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
                      label="Funcionário"
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                          }
                        }
                      }}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      {employees.map((employee) => (
                        <MenuItem key={employee.id} value={employee.id}>
                          {employee.nome}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField
                    fullWidth
                    label="Data Início"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    InputLabelProps={{ 
                      shrink: true,
                      sx: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&.Mui-focused': {
                          color: 'rgba(255, 255, 255, 0.9)'
                        }
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.5)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.7)',
                        },
                        background: 'rgba(255, 255, 255, 0.05)',
                      }
                    }}
                    variant="outlined"
                    inputProps={{ max: dateTo || undefined }}
                  />
                </Grid>
                
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField
                    fullWidth
                    label="Data Fim"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    InputLabelProps={{ 
                      shrink: true,
                      sx: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&.Mui-focused': {
                          color: 'rgba(255, 255, 255, 0.9)'
                        }
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.5)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.7)',
                        },
                        background: 'rgba(255, 255, 255, 0.05)',
                      }
                    }}
                    variant="outlined"
                    inputProps={{ min: dateFrom || undefined }}
                  />
                </Grid>
                
                <Grid size={{ xs: 12, md: 1 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={clearFilters}
                    startIcon={<FilterListIcon />}
                    sx={{
                      height: '56px',
                      color: 'white',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        background: 'rgba(255, 255, 255, 0.05)',
                      },
                      fontWeight: 600,
                      textTransform: 'none'
                    }}
                  >
                    Limpar
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filtros para histórico individual - só aparecem quando há funcionário selecionado */}
      {selectedEmployee && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card 
            sx={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              mb: 4
            }}
          >
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Data Início"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    InputLabelProps={{ 
                      shrink: true,
                      sx: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&.Mui-focused': {
                          color: 'rgba(255, 255, 255, 0.9)'
                        }
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.5)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.7)',
                        },
                        background: 'rgba(255, 255, 255, 0.05)',
                      }
                    }}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Data Fim"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    InputLabelProps={{ 
                      shrink: true,
                      sx: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&.Mui-focused': {
                          color: 'rgba(255, 255, 255, 0.9)'
                        }
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.5)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.7)',
                        },
                        background: 'rgba(255, 255, 255, 0.05)',
                      }
                    }}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid size={{ xs: 12, md: 2 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => buscarRegistrosFuncionario(selectedEmployee.id, selectedEmployee.nome)}
                    disabled={loading}
                    sx={{
                      height: '56px',
                      background: '#3b82f6',
                      '&:hover': {
                        background: '#2563eb',
                      },
                      fontWeight: 600,
                      textTransform: 'none'
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Filtrar'}
                  </Button>
                </Grid>
                
                <Grid size={{ xs: 12, md: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => {
                      setDateFrom('');
                      setDateTo('');
                      buscarRegistrosFuncionario(selectedEmployee.id, selectedEmployee.nome);
                    }}
                    startIcon={<FilterListIcon />}
                    sx={{
                      height: '56px',
                      color: 'white',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        background: 'rgba(255, 255, 255, 0.05)',
                      },
                      fontWeight: 600,
                      textTransform: 'none'
                    }}
                  >
                    Limpar
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Conteúdo principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
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
            {/* Histórico Individual do Funcionário */}
            {selectedEmployee && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600, 
                      color: 'white',
                      fontSize: '18px'
                    }}
                  >
                    Histórico de Registros ({selectedEmployeeRecords.length} registros)
                  </Typography>
                  
                  {selectedEmployee.ultimoRegistro && (
                    <Chip
                      label={`Último: ${getStatusText(selectedEmployee.ultimoRegistro.tipo || 'entrada')} - ${formatDateTime(selectedEmployee.ultimoRegistro.data_hora || '').time}`}
                      color={getStatusColor(selectedEmployee.ultimoRegistro.tipo || 'entrada') as any}
                      size="small"
                    />
                  )}
                </Box>
                
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
                          Data
                        </TableCell>
                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                          Hora
                        </TableCell>
                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                          Status
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

      {/* Email Dialog */}
      <Dialog 
        open={emailDialogOpen} 
        onClose={() => !emailEnviando && setEmailDialogOpen(false)}
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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
              Enviar Relatório por Email
            </Typography>
            <IconButton
              onClick={() => !emailEnviando && setEmailDialogOpen(false)}
              disabled={emailEnviando}
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email Destinatário"
            type="email"
            fullWidth
            variant="outlined"
            value={emailDestino}
            onChange={(e) => setEmailDestino(e.target.value)}
            disabled={emailEnviando}
            sx={{ 
              mt: 2,
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: 'rgba(255, 255, 255, 0.9)'
                }
              },
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.7)',
                },
                background: 'rgba(255, 255, 255, 0.05)',
              }
            }}
          />
          {selectedEmployee && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Relatório de: <strong style={{ color: 'white' }}>{selectedEmployee.nome}</strong>
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Registros: <strong style={{ color: 'white' }}>{selectedEmployeeRecords.length}</strong>
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Período: <strong style={{ color: 'white' }}>{dateFrom || 'Não informado'} a {dateTo || 'Não informado'}</strong>
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setEmailDialogOpen(false)}
            disabled={emailEnviando}
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
            onClick={enviarPorEmail}
            disabled={emailEnviando || !emailDestino}
            color="primary"
            variant="contained"
            sx={{
              backgroundColor: '#2196f3',
              '&:hover': {
                backgroundColor: '#1976d2',
              }
            }}
          >
            {emailEnviando ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                Enviando...
              </>
            ) : (
              <>
                <EmailIcon sx={{ mr: 1 }} />
                Enviar
              </>
            )}
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

export default RecordsPage;

255, 0.9)', fontWeight: 600 }}>
                          Data
                        </TableCell>
                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                          Hora
                        </TableCell>
                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                          Tipo
                        </TableCell>
                        <TableCell align="center" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                          Ações
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedEmployeeRecords.length > 0 ? (
                        selectedEmployeeRecords.map((record, index) => {
                          const { date, time } = formatDateTime(record.data_hora || '');
                          return (
                            <TableRow key={record.registro_id || `record-${index}`} hover>
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
                          <TableCell colSpan={4} align="center">
                            <Box sx={{ py: 8 }}>
                              <AccessTimeIcon sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '4rem', mb: 2 }} />
                              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 1 }}>
                                Nenhum registro encontrado
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                Este funcionário ainda não possui registros de ponto no período selecionado
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

            {/* Resumo por funcionário */}
            {!selectedEmployee && tabValue === 0 && (
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
                              {String(summary.horas_trabalhadas ?? summary.total_horas ?? 'N/A')}
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
                                Nenhum registro encontrado
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                {nome || dateFrom || dateTo 
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
            )}

            {/* Registros detalhados */}
            {!selectedEmployee && tabValue === 1 && (
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
                        <TableCell sx={{ color: 'rgba(255, 255,