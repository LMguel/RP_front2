import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  AccessTime as AccessTimeIcon,
  GetApp as GetAppIcon,
  FilterList as FilterListIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
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

const RecordsPage: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0); // 0 = Resumo, 1 = Detalhado
  const [employeeSummaries, setEmployeeSummaries] = useState<EmployeeSummary[]>([]);
  const [selectedEmployeeRecords, setSelectedEmployeeRecords] = useState<TimeRecord[]>([]);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<TimeRecord[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<TimeRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [nome, setNome] = useState('');
  const [opcoesNomes, setOpcoesNomes] = useState<string[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  const buscarRegistros = React.useCallback(async () => {
    // Validação de datas
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
      if (selectedEmployee) params.funcionario_id = selectedEmployee;

      const response = await apiService.getTimeRecords(params);
      
      if (tabValue === 0) {
        // Resumo - agrupar por funcionário
        const summaries = Array.isArray(response) ? response : [];
        setEmployeeSummaries(summaries);
      } else {
        // Detalhado
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
  }, [dateFrom, dateTo, nome, selectedEmployee, tabValue]);

  const buscarNomes = async (nomeParcial: string) => {
    try {
      const response = await apiService.getEmployees();
      const employeesList = response.funcionarios || [];
      const nomesFiltrados = employeesList
        .filter((emp: Employee) => emp.nome.toLowerCase().includes(nomeParcial.toLowerCase()))
        .map((emp: Employee) => emp.nome);
      setOpcoesNomes(nomesFiltrados);
    } catch (err) {
      console.error('Erro ao buscar nomes:', err);
    }
  };

  useEffect(() => {
    buscarRegistros();
  }, [buscarRegistros]);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (tabValue === 1) {
      filterRecords();
    }
  }, [records, searchTerm, selectedEmployee, dateFrom, dateTo, tabValue]);

  const loadEmployees = async () => {
    try {
      const response = await apiService.getEmployees();
      const employeesList = response.funcionarios || [];
      setEmployees(employeesList.sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  const filterRecords = () => {
    let filtered = [...records];

    if (searchTerm.trim()) {
      filtered = filtered.filter(record =>
        record.funcionario_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.registro_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedEmployee) {
      filtered = filtered.filter(record => record.funcionario_id === selectedEmployee);
    }

    if (dateFrom) {
      filtered = filtered.filter(record => record.data_hora >= dateFrom);
    }

    if (dateTo) {
      filtered = filtered.filter(record => record.data_hora <= dateTo + ' 23:59:59');
    }

    setFilteredRecords(filtered);
  };

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
      // Buscar nome do funcionário e definir no campo de busca
      const funcionarioNome = summary.funcionario || summary.funcionario_nome || '';
      setSearchTerm(funcionarioNome);
      setTabValue(1); // Mudar para aba detalhada
    } else {
      showSnackbar('ID do funcionário não encontrado', 'error');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setNome('');
    setSelectedEmployee('');
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <PageLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Box className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <Box>
          <Typography variant="h4" className="font-bold text-gray-800 mb-2">
            Registros de Ponto
          </Typography>
          <Typography variant="body1" className="text-gray-600">
            Visualize e gerencie os registros de ponto dos funcionários
          </Typography>
        </Box>
        <Box className="flex gap-2">
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={exportToExcel}
            disabled={(tabValue === 0 ? employeeSummaries.length : filteredRecords.length) === 0 || loading}
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            Exportar Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<GetAppIcon />}
            onClick={exportToExcel}
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            Exportar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setFormOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Registro Manual
          </Button>
        </Box>
      </motion.div>

      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardContent>
            <Tabs value={tabValue} onChange={handleTabChange} className="mb-4">
              <Tab label="Resumo por Funcionário" />
              <Tab label="Registros Detalhados" />
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                {tabValue === 0 ? (
                  <Autocomplete
                    freeSolo
                    options={opcoesNomes}
                    value={nome}
                    onInputChange={(event, value) => {
                      setNome(value || '');
                      if (value && value.length > 0) {
                        buscarNomes(value);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        placeholder="Buscar por funcionário..."
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon className="text-gray-400" />
                            </InputAdornment>
                          ),
                        }}
                        variant="outlined"
                      />
                    )}
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
                          <SearchIcon className="text-gray-400" />
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                  />
                )}
              </Grid>
              
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Funcionário</InputLabel>
                  <Select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    label="Funcionário"
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
                  InputLabelProps={{ shrink: true }}
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
                  InputLabelProps={{ shrink: true }}
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
                  className="h-full"
                >
                  Limpar
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>

      {/* Content based on tab */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardContent>
            {tabValue === 0 ? (
              // Resumo por funcionário
              <>
                <Typography variant="h6" className="font-semibold mb-4">
                  Resumo por Funcionário ({employeeSummaries.length})
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Funcionário</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Horas Trabalhadas</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {employeeSummaries.length > 0 ? (
                        employeeSummaries.map((summary, index) => (
                          <TableRow key={index} hover>
                            <TableCell
                              sx={{ 
                                cursor: 'pointer', 
                                color: '#0288d1',
                                '&:hover': { textDecoration: 'underline' }
                              }}
                              onClick={() => handleClickFuncionario(summary)}
                            >
                              {summary.funcionario || summary.funcionario_nome || 'Desconhecido'}
                            </TableCell>
                            <TableCell>
                              {String(summary.horas_trabalhadas ?? summary.total_horas ?? 'N/A')}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} align="center">
                            <Box className="py-8">
                              <AccessTimeIcon className="text-gray-400 text-6xl mb-4" />
                              <Typography variant="h6" className="text-gray-500 mb-2">
                                Nenhum registro encontrado
                              </Typography>
                              <Typography variant="body2" className="text-gray-400">
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
                <Typography variant="h6" className="font-semibold mb-4">
                  Registros Detalhados ({filteredRecords.length})
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Funcionário</TableCell>
                        <TableCell>Data</TableCell>
                        <TableCell>Hora</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="center">Ações</TableCell>
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
                                  <Typography variant="body2" className="font-medium">
                                    {record.funcionario_nome || record.funcionario_id || 'N/A'}
                                  </Typography>
                                  <Typography variant="caption" className="text-gray-500">
                                    ID: {record.registro_id?.slice(0, 8) || record.funcionario_id?.slice(0, 8) || 'N/A'}...
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {date}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
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
                                  className="text-red-600 hover:bg-red-50"
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
                            <Box className="py-8">
                              <AccessTimeIcon className="text-gray-400 text-6xl mb-4" />
                              <Typography variant="h6" className="text-gray-500 mb-2">
                                Nenhum registro encontrado
                              </Typography>
                              <Typography variant="body2" className="text-gray-400">
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
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" className="font-semibold">
            Confirmar Exclusão
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir este registro de ponto?
          </Typography>
          <Typography variant="body2" className="text-red-600 mt-2">
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={submitting}
            className="text-gray-600"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteRecord}
            color="error"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
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
    </Box>
    </PageLayout>
  );
};

export default RecordsPage;