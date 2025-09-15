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
  Alert,
  CircularProgress,
  Container,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  Business as BusinessIcon,
  Lock as LockIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState({
    usuario_id: '',
    senha: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { login, isLoading } = useAuth();
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
    }

    if (!formData.senha) {
      newErrors.senha = 'Senha é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const success = await login(formData);
    if (success) {
      navigate('/dashboard');
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
                  <BusinessIcon sx={{ color: 'white', fontSize: 32 }} />
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
                  Sistema de Controle de Ponto Eletrônico
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
                </Box>

                <Box sx={{ textAlign: 'right', mt: 2, mb: 4 }}>
                  <Link
                    component={RouterLink}
                    to="/forgot-password"
                    underline="hover"
                    sx={{ 
                      color: '#4f46e5', 
                      fontSize: '14px',
                      fontWeight: 500,
                      '&:hover': {
                        color: '#3730a3',
                      }
                    }}
                  >
                    Esqueci minha senha
                  </Link>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
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
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>

              <Box sx={{ textAlign: 'center', mt: 4, mb: 3 }}>
                <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '14px' }}>
                  Não tem uma conta?{' '}
                  <Link
                    component={RouterLink}
                    to="/register"
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
                    Cadastre-se aqui
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

export default LoginForm;