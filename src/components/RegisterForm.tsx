import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Link,
  CircularProgress,
  Container,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  PersonAdd as PersonAddIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState({
    usuario_id: '',
    email: '',
    empresa_nome: '',
    senha: '',
    confirmar_senha: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.usuario_id.trim()) {
      newErrors.usuario_id = 'ID do usuário é obrigatório';
    } else if (formData.usuario_id.length < 3) {
      newErrors.usuario_id = 'ID deve ter pelo menos 3 caracteres';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.empresa_nome.trim()) {
      newErrors.empresa_nome = 'Nome da empresa é obrigatório';
    }

    if (!formData.senha) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (formData.senha.length < 6) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (!formData.confirmar_senha) {
      newErrors.confirmar_senha = 'Confirmação de senha é obrigatória';
    } else if (formData.senha !== formData.confirmar_senha) {
      newErrors.confirmar_senha = 'Senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const { confirmar_senha, ...registerData } = formData;
    const success = await register(registerData);
    if (success) {
      navigate('/login');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'auto',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><pattern id='grain' width='100' height='100' patternUnits='userSpaceOnUse'><circle cx='25' cy='25' r='1' fill='white' opacity='0.1'/><circle cx='75' cy='75' r='0.5' fill='white' opacity='0.1'/><circle cx='50' cy='10' r='0.8' fill='white' opacity='0.1'/></pattern></defs><rect width='100%25' height='100%25' fill='url(%23grain)'/></svg>")`,
          pointerEvents: 'none',
        }
      }}
    >
  <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Card
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 30px 80px rgba(0, 0, 0, 0.2)',
              },
              maxWidth: 420,
              mt: { xs: 6, sm: 10 },
              mx: 'auto',
            }}
          >
            <CardContent sx={{ p: { xs: 4, sm: 6 }, textAlign: 'center' }}>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.12, duration: 0.36 }}
                style={{ marginBottom: 40 }}
              >
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 64,
                    height: 64,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    mb: 2.5,
                    boxShadow: '0 8px 32px rgba(79, 70, 229, 0.3)',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    }
                  }}
                >
                  <PersonAddIcon sx={{ color: 'white', fontSize: 32 }} />
                </Box>

                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700, 
                    color: '#1a1a1a', 
                    mb: 1,
                    letterSpacing: '-0.5px',
                    fontSize: { xs: '1.75rem', sm: '2rem' }
                  }}
                >
                  REGISTRA.PONTO
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#6b7280',
                    fontWeight: 400,
                    fontSize: '15px'
                  }}
                >
                  Crie sua conta e comece a usar o sistema
                </Typography>
              </motion.div>

              <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                  <Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500, 
                        color: '#374151', 
                        mb: 1, 
                        textAlign: 'left',
                        fontSize: '14px'
                      }}
                    >
                      ID do Usuário
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="Digite seu ID de usuário"
                      name="usuario_id"
                      value={formData.usuario_id}
                      onChange={handleChange}
                      error={!!errors.usuario_id}
                      helperText={errors.usuario_id}
                      variant="outlined"
                      disabled={isLoading}
                      size="medium"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon sx={{ color: '#6b7280' }} />
                          </InputAdornment>
                        ),
                        sx: {
                          fontSize: '16px',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderWidth: '2px',
                            borderColor: '#e5e7eb',
                            borderRadius: '12px',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#d1d5db',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#4f46e5',
                            boxShadow: '0 0 0 4px rgba(79, 70, 229, 0.1)',
                          },
                          '& input': {
                            padding: '16px 14px 16px 0',
                          },
                          '& input::placeholder': {
                            color: '#9ca3af',
                            opacity: 1,
                          },
                          background: 'white',
                          transition: 'all 0.3s ease',
                        }
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500, 
                        color: '#374151', 
                        mb: 1, 
                        textAlign: 'left',
                        fontSize: '14px'
                      }}
                    >
                      Email
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="Digite seu email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      error={!!errors.email}
                      helperText={errors.email}
                      variant="outlined"
                      disabled={isLoading}
                      size="medium"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon sx={{ color: '#6b7280' }} />
                          </InputAdornment>
                        ),
                        sx: {
                          fontSize: '16px',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderWidth: '2px',
                            borderColor: '#e5e7eb',
                            borderRadius: '12px',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#d1d5db',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#4f46e5',
                            boxShadow: '0 0 0 4px rgba(79, 70, 229, 0.1)',
                          },
                          '& input': {
                            padding: '16px 14px 16px 0',
                          },
                          '& input::placeholder': {
                            color: '#9ca3af',
                            opacity: 1,
                          },
                          background: 'white',
                          transition: 'all 0.3s ease',
                        }
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500, 
                        color: '#374151', 
                        mb: 1, 
                        textAlign: 'left',
                        fontSize: '14px'
                      }}
                    >
                      Nome da Empresa
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="Digite o nome da empresa"
                      name="empresa_nome"
                      value={formData.empresa_nome}
                      onChange={handleChange}
                      error={!!errors.empresa_nome}
                      helperText={errors.empresa_nome}
                      variant="outlined"
                      disabled={isLoading}
                      size="medium"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon sx={{ color: '#6b7280' }} />
                          </InputAdornment>
                        ),
                        sx: {
                          fontSize: '16px',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderWidth: '2px',
                            borderColor: '#e5e7eb',
                            borderRadius: '12px',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#d1d5db',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#4f46e5',
                            boxShadow: '0 0 0 4px rgba(79, 70, 229, 0.1)',
                          },
                          '& input': {
                            padding: '16px 14px 16px 0',
                          },
                          '& input::placeholder': {
                            color: '#9ca3af',
                            opacity: 1,
                          },
                          background: 'white',
                          transition: 'all 0.3s ease',
                        }
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500, 
                        color: '#374151', 
                        mb: 1, 
                        textAlign: 'left',
                        fontSize: '14px'
                      }}
                    >
                      Senha
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="Digite sua senha"
                      name="senha"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.senha}
                      onChange={handleChange}
                      error={!!errors.senha}
                      helperText={errors.senha}
                      variant="outlined"
                      disabled={isLoading}
                      size="medium"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon sx={{ color: '#6b7280' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              disabled={isLoading}
                              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                              sx={{
                                color: '#6b7280',
                                '&:hover': {
                                  color: '#4f46e5',
                                }
                              }}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                        sx: {
                          fontSize: '16px',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderWidth: '2px',
                            borderColor: '#e5e7eb',
                            borderRadius: '12px',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#d1d5db',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#4f46e5',
                            boxShadow: '0 0 0 4px rgba(79, 70, 229, 0.1)',
                          },
                          '& input': {
                            padding: '16px 14px 16px 0',
                          },
                          '& input::placeholder': {
                            color: '#9ca3af',
                            opacity: 1,
                          },
                          background: 'white',
                          transition: 'all 0.3s ease',
                        }
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500, 
                        color: '#374151', 
                        mb: 1, 
                        textAlign: 'left',
                        fontSize: '14px'
                      }}
                    >
                      Confirmar Senha
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="Confirme sua senha"
                      name="confirmar_senha"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmar_senha}
                      onChange={handleChange}
                      error={!!errors.confirmar_senha}
                      helperText={errors.confirmar_senha}
                      variant="outlined"
                      disabled={isLoading}
                      size="medium"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon sx={{ color: '#6b7280' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                              disabled={isLoading}
                              aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                              sx={{
                                color: '#6b7280',
                                '&:hover': {
                                  color: '#4f46e5',
                                }
                              }}
                            >
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                        sx: {
                          fontSize: '16px',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderWidth: '2px',
                            borderColor: '#e5e7eb',
                            borderRadius: '12px',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#d1d5db',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#4f46e5',
                            boxShadow: '0 0 0 4px rgba(79, 70, 229, 0.1)',
                          },
                          '& input': {
                            padding: '16px 14px 16px 0',
                          },
                          '& input::placeholder': {
                            color: '#9ca3af',
                            opacity: 1,
                          },
                          background: 'white',
                          transition: 'all 0.3s ease',
                        }
                      }}
                    />
                  </Box>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <PersonAddIcon />}
                  sx={{ 
                    py: 2, 
                    borderRadius: '12px', 
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    boxShadow: '0 8px 32px rgba(79, 70, 229, 0.3)',
                    fontSize: '16px',
                    fontWeight: 600,
                    textTransform: 'none',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    mt: 4,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 40px rgba(79, 70, 229, 0.4)',
                      background: 'linear-gradient(135deg, #4338ca 0%, #7c3aed 100%)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                    '&:disabled': {
                      background: 'linear-gradient(135deg, #9ca3af 0%, #9ca3af 100%)',
                      transform: 'none',
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                      transition: 'left 0.5s ease',
                    },
                    '&:hover::before': {
                      left: '100%',
                    }
                  }}
                >
                  {isLoading ? 'Cadastrando...' : 'Cadastrar'}
                </Button>
              </form>

              <Box sx={{ textAlign: 'center', mt: 3, mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '14px' }}>
                  Já tem uma conta?{' '}
                  <Link
                    component={RouterLink}
                    to="/login"
                    sx={{ 
                      color: '#4f46e5', 
                      fontWeight: 600, 
                      textDecoration: 'none',
                      '&:hover': {
                        color: '#3730a3',
                        textDecoration: 'underline',
                      }
                    }}
                  >
                    Faça login aqui
                  </Link>
                </Typography>
              </Box>

              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 1,
                  color: '#6b7280',
                  fontSize: '12px'
                }}
              >
                <SecurityIcon sx={{ fontSize: 16, color: '#10b981' }} />
                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                  Conexão segura e criptografada
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
};

export default RegisterForm;