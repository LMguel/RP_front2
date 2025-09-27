import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageLayout from '../sections/PageLayout';
import EmployeeSearch from '../components/EmployeeSearch';
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
} from '@mui/material';
import {
  Add as AddIcon,
  FileDownload as FileDownloadIcon,
  Delete as DeleteIcon,
  AccessTime as AccessTimeIcon,
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
  
  // Estados para busca de funcionários
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  
  // Estados para filtros
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [nome, setNome] = useState('');
  const [opcoesNomes, setOpcoesNomes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('');
  
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

  // Busca de nomes para autocomplete
  const buscarNomes = async (termo: string) => {
    try {
      const response = await apiService.getEmployees();
      const funcionarios = response.funcionarios || [];
      const nomes = funcionarios
        .filter((emp: Employee) => emp.nome.toLowerCase().includes(termo.toLowerCase()))
        .map((emp: Employee) => emp.nome)
        .slice(0, 10);
      setOpcoesNomes(nomes);
    } catch (err) {
      console.error('Erro ao buscar nomes:', err);
    }
  };

  // Busca fluida de funcionários para navegação individual
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
    setFilteredEmployees(filtered.slice(0, 8));
    setShowEmployeeSuggestions(true);
  }, [employees]);

  // Navegação para página individual do funcionário
  const handleEmployeeSelect = (employee: Employee) => {
    setEmployeeSearchTerm('');
    setShowEmployeeSuggestions(false);
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

  // Criar registro manual
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
            String(summary.horas_trabalhadas ?? summary.total_horas ?? 'N/A')
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

  const clearFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setNome('');
    setSelectedEmployeeFilter('');
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

  if (loading) {
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

      {/* Busca por funcionário individual */}
      <EmployeeSearch
        employeeSearchTerm={employeeSearchTerm}
        onEmployeeSearchChange={handleEmployeeSearchChange}
        showEmployeeSuggestions={showEmployeeSuggestions}
        filteredEmployees={filteredEmployees}
        onEmployeeSelect={handleEmployeeSelect}
        onClearSearch={() => {
          setEmployeeSearchTerm('');
          setShowEmployeeSuggestions(false);
        }}
        onFocus={() => {
          if (employeeSearchTerm && filteredEmployees.length > 0) {
            setShowEmployeeSuggestions(true);
          }
        }}
        onBlur={() => {
          setTimeout(() => setShowEmployeeSuggestions(false), 200);
        }}
      />

      {/* Tabs */}
      <RecordsTabs
        tabValue={tabValue}
        onTabChange={handleTabChange}
      />

      {/* Filtros */}
      <RecordsFilters
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onClearFilters={clearFilters}
        nome={nome}
        onNomeChange={setNome}
        opcoesNomes={opcoesNomes}
        onBuscarNomes={buscarNomes}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        selectedEmployeeFilter={selectedEmployeeFilter}
        onSelectedEmployeeFilterChange={setSelectedEmployeeFilter}
        employees={employees}
        tabValue={tabValue}
      />

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
                                Nenhum resumo encontrado
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