import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';
import { Employee } from '../types';

interface TimeRecordFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    funcionario_id: string;
    data_hora: string;
    tipo: 'entrada' | 'saída';
  }) => Promise<void>;
  loading?: boolean;
  employees?: Employee[];
}

const TimeRecordForm: React.FC<TimeRecordFormProps> = ({
  open,
  onClose,
  onSubmit,
  loading = false,
  employees: propEmployees = [],
}) => {
  const [formData, setFormData] = useState({
    funcionario_id: '',
    data_hora: '',
    tipo: 'entrada' as 'entrada' | 'saída',
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  useEffect(() => {
    if (open) {
      // Use prop employees if available, otherwise load them
      if (propEmployees.length > 0) {
        setEmployees(propEmployees.sort((a, b) => a.nome.localeCompare(b.nome)));
      } else {
        loadEmployees();
      }
      
      // Set current date and time
      const now = new Date();
      const formattedDateTime = now.toISOString().slice(0, 16);
      setFormData(prev => ({
        ...prev,
        data_hora: formattedDateTime,
      }));
    }
  }, [open, propEmployees]);

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const response = await apiService.getEmployees();
      const employeesList = response.funcionarios || [];
      setEmployees(employeesList.sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (err) {
      console.error('Error loading employees:', err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.funcionario_id) {
      newErrors.funcionario_id = 'Funcionário é obrigatório';
    }

    if (!formData.data_hora) {
      newErrors.data_hora = 'Data e hora são obrigatórias';
    }

    if (!formData.tipo) {
      newErrors.tipo = 'Tipo de registro é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Format datetime for API
    const formattedDateTime = new Date(formData.data_hora).toISOString().slice(0, 19).replace('T', ' ');
    
    console.log('Submitting record with data:', {
      funcionario_id: formData.funcionario_id,
      data_hora: formattedDateTime,
      tipo: formData.tipo,
    });
    
    await onSubmit({
      funcionario_id: formData.funcionario_id,
      data_hora: formattedDateTime,
      tipo: formData.tipo,
    });
  };

  const handleClose = () => {
    setFormData({
      funcionario_id: '',
      data_hora: '',
      tipo: 'entrada',
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle className="flex items-center justify-between">
        <Box className="flex items-center gap-2">
          <AccessTimeIcon className="text-blue-600" />
          <Typography variant="h6" className="font-semibold">
            Registrar Ponto Manual
          </Typography>
        </Box>
        <IconButton onClick={handleClose} disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-4">
          {loadingEmployees ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <FormControl fullWidth error={!!errors.funcionario_id}>
                <InputLabel>Funcionário</InputLabel>
                <Select
                  name="funcionario_id"
                  value={formData.funcionario_id}
                  onChange={handleSelectChange}
                  label="Funcionário"
                  disabled={loading}
                >
                  {employees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.nome} - {employee.cargo}
                    </MenuItem>
                  ))}
                </Select>
                {errors.funcionario_id && (
                  <Typography variant="caption" color="error" className="mt-1">
                    {errors.funcionario_id}
                  </Typography>
                )}
              </FormControl>

              <TextField
                fullWidth
                label="Data e Hora"
                name="data_hora"
                type="datetime-local"
                value={formData.data_hora}
                onChange={handleChange}
                error={!!errors.data_hora}
                helperText={errors.data_hora}
                disabled={loading}
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                }}
              />

              <FormControl fullWidth error={!!errors.tipo}>
                <InputLabel>Tipo de Registro</InputLabel>
                <Select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleSelectChange}
                  label="Tipo de Registro"
                  disabled={loading}
                >
                  <MenuItem value="entrada">Entrada</MenuItem>
                  <MenuItem value="saída">Saída</MenuItem>
                </Select>
                {errors.tipo && (
                  <Typography variant="caption" color="error" className="mt-1">
                    {errors.tipo}
                  </Typography>
                )}
              </FormControl>
            </>
          )}
        </DialogContent>

        <DialogActions className="p-6">
          <Button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-600"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || loadingEmployees}
            className="bg-blue-600 hover:bg-blue-700"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AccessTimeIcon />}
          >
            {loading ? 'Registrando...' : 'Registrar Ponto'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TimeRecordForm;
