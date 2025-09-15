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
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Employee } from '../types';
import EmployeeForm from '../components/EmployeeForm';

const EmployeesPage: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Extract unique cargos from existing employees
  const existingCargos = [...new Set(employees.map(emp => emp.cargo))].filter(Boolean);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getEmployees();
      const employeesList = response.funcionarios || [];
      setEmployees(employeesList);
    } catch (err: any) {
      console.error('Error loading employees:', err);
      setError('Erro ao carregar funcionários');
      toast.error('Erro ao carregar funcionários');
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    if (!searchTerm.trim()) {
      setFilteredEmployees(employees);
      return;
    }

    const filtered = employees.filter(employee =>
      employee.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.cargo.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmployees(filtered);
  };

  const handleCreateEmployee = async (formData: FormData) => {
    try {
      setSubmitting(true);
      await apiService.createEmployee(formData);
      toast.success('Funcionário cadastrado com sucesso!');
      setFormOpen(false);
      loadEmployees();
    } catch (err: any) {
      console.error('Error creating employee:', err);
      toast.error('Erro ao cadastrar funcionário');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateEmployee = async (formData: FormData) => {
    if (!editingEmployee) return;

    try {
      setSubmitting(true);
      await apiService.updateEmployee(editingEmployee.id, formData);
      toast.success('Funcionário atualizado com sucesso!');
      setFormOpen(false);
      setEditingEmployee(null);
      loadEmployees();
    } catch (err: any) {
      console.error('Error updating employee:', err);
      toast.error('Erro ao atualizar funcionário');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;

    try {
      setSubmitting(true);
      await apiService.deleteEmployee(employeeToDelete.id);
      toast.success('Funcionário excluído com sucesso!');
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
      loadEmployees();
    } catch (err: any) {
      console.error('Error deleting employee:', err);
      toast.error('Erro ao excluir funcionário');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, employee: Employee) => {
    setMenuAnchor(event.currentTarget);
    setSelectedEmployee(employee);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedEmployee(null);
  };

  const handleEdit = () => {
    setEditingEmployee(selectedEmployee);
    setFormOpen(true);
    handleMenuClose();
  };

  const handleDelete = () => {
    setEmployeeToDelete(selectedEmployee);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
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
            Funcionários
          </Typography>
          <Typography variant="body1" className="text-gray-600">
            Gerencie os funcionários da sua empresa
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Cadastrar Funcionário
        </Button>
      </motion.div>

      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardContent>
            <TextField
              fullWidth
              placeholder="Buscar por nome ou cargo..."
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
          </CardContent>
        </Card>
      </motion.div>

      {/* Employees Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardContent>
            <Typography variant="h6" className="font-semibold mb-4">
              Lista de Funcionários ({filteredEmployees.length})
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Funcionário</TableCell>
                    <TableCell>Cargo</TableCell>
                    <TableCell>Data de Cadastro</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((employee) => (
                      <TableRow key={employee.id} hover>
                        <TableCell>
                          <Box className="flex items-center gap-3">
                            <Avatar
                              src={employee.foto_url}
                              alt={employee.nome}
                              className="w-10 h-10"
                            >
                              <PersonIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" className="font-medium">
                                {employee.nome}
                              </Typography>
                              <Typography variant="caption" className="text-gray-500">
                                ID: {employee.id}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={employee.cargo}
                            size="small"
                            className="bg-blue-50 text-blue-700"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(employee.data_cadastro)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            onClick={(e) => handleMenuOpen(e, employee)}
                            size="small"
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Box className="py-8">
                          <PersonIcon className="text-gray-400 text-6xl mb-4" />
                          <Typography variant="h6" className="text-gray-500 mb-2">
                            {searchTerm ? 'Nenhum funcionário encontrado' : 'Nenhum funcionário cadastrado'}
                          </Typography>
                          <Typography variant="body2" className="text-gray-400">
                            {searchTerm 
                              ? 'Tente ajustar os termos de busca'
                              : 'Comece cadastrando seu primeiro funcionário'
                            }
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Employee Form Dialog */}
      <EmployeeForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingEmployee(null);
        }}
        onSubmit={editingEmployee ? handleUpdateEmployee : handleCreateEmployee}
        employee={editingEmployee}
        loading={submitting}
        existingCargos={existingCargos}
      />

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete} className="text-red-600">
          <ListItemIcon>
            <DeleteIcon fontSize="small" className="text-red-600" />
          </ListItemIcon>
          <ListItemText>Excluir</ListItemText>
        </MenuItem>
      </Menu>

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
            Tem certeza que deseja excluir o funcionário{' '}
            <strong>{employeeToDelete?.nome}</strong>?
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
            onClick={handleDeleteEmployee}
            color="error"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
          >
            {submitting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </PageLayout>
  );
};

export default EmployeesPage;
