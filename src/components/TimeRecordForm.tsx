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
      if (propEmployees.length > 0) {
        setEmployees(propEmployees.sort((a, b) => a.nome.localeCompare(b.nome)));
      } else {
        loadEmployees();
      }
      
      const now = new Date();
      // Get current time in Brazil timezone and format for datetime-local input
      const brasiliaTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
      const year = brasiliaTime.getFullYear();
      const month = String(brasiliaTime.getMonth() + 1).padStart(2, '0');
      const day = String(brasiliaTime.getDate()).padStart(2, '0');
      const hours = String(brasiliaTime.getHours()).padStart(2, '0');
      const minutes = String(brasiliaTime.getMinutes()).padStart(2, '0');
      const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
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
      interface SortableEmployee {
        nome: string;
        [key: string]: any;
      }
      setEmployees(employeesList.sort((a: SortableEmployee, b: SortableEmployee) => a.nome.localeCompare(b.nome)));
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

    // Convert to proper format for database, keeping the user's selected time
    // Parse the datetime-local input directly without timezone conversion
    const formattedDateTime = formData.data_hora.replace('T', ' ') + ':00';
    
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
        sx: {
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }
      }}
      sx={{
        '& .MuiDialog-container': {
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%)',
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          color: 'white',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          pb: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AccessTimeIcon sx={{ color: 'rgba(255, 255, 255, 0.9)' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
            Registrar Ponto Manual
          </Typography>
        </Box>
        <IconButton 
          onClick={handleClose} 
          disabled={loading}
          sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': {
              color: 'white',
              background: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ py: 4 }}>
          {loadingEmployees ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress sx={{ color: 'white' }} />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <FormControl 
                fullWidth 
                error={!!errors.funcionario_id}
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
                  name="funcionario_id"
                  value={formData.funcionario_id}
                  onChange={handleSelectChange}
                  label="Funcionário"
                  disabled={loading}
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
                  {employees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.nome} - {employee.cargo}
                    </MenuItem>
                  ))}
                </Select>
                {errors.funcionario_id && (
                  <Typography variant="caption" sx={{ color: '#ef4444', mt: 1 }}>
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
                  },
                  '& .MuiFormHelperText-root': {
                    color: '#ef4444'
                  }
                }}
              />

              <FormControl 
                fullWidth 
                error={!!errors.tipo}
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
                <InputLabel>Tipo de Registro</InputLabel>
                <Select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleSelectChange}
                  label="Tipo de Registro"
                  disabled={loading}
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
                  <MenuItem value="entrada">Entrada</MenuItem>
                  <MenuItem value="saída">Saída</MenuItem>
                </Select>
                {errors.tipo && (
                  <Typography variant="caption" sx={{ color: '#ef4444', mt: 1 }}>
                    {errors.tipo}
                  </Typography>
                )}
              </FormControl>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white'
              }
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || loadingEmployees}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AccessTimeIcon />}
            sx={{ 
              background: '#2563eb',
              color: 'white',
              fontWeight: 600,
              px: 3,
              '&:hover': {
                background: '#1d4ed8',
              },
              '&:disabled': {
                background: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            {loading ? 'Registrando...' : 'Registrar Ponto'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TimeRecordForm;