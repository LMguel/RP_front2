import React, { useState } from 'react';
import PageLayout from '../sections/PageLayout';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Switch,
  FormControlLabel,
  Avatar,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // User Profile
  const [profileData, setProfileData] = useState({
    usuario_id: user?.usuario_id || '',
    email: user?.email || '',
  });

  // Company Settings
  const [companyData, setCompanyData] = useState({
    empresa_nome: user?.empresa_nome || '',
    cnpj: '',
    endereco: '',
    telefone: '',
  });

  // Security Settings
  const [securityData, setSecurityData] = useState({
    senha_atual: '',
    nova_senha: '',
    confirmar_senha: '',
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSecurityData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      // API call to update profile
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompany = async () => {
    try {
      setLoading(true);
      // API call to update company
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success('Dados da empresa atualizados com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar dados da empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (securityData.nova_senha !== securityData.confirmar_senha) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (securityData.nova_senha.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      // API call to change password
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success('Senha alterada com sucesso!');
      setSecurityData({
        senha_atual: '',
        nova_senha: '',
        confirmar_senha: '',
      });
    } catch (error) {
      toast.error('Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <PageLayout>
      <Box className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" className="font-bold text-gray-800 mb-2">
          Configurações
        </Typography>
        <Typography variant="body1" className="text-gray-600">
          Gerencie suas configurações pessoais e da empresa
        </Typography>
      </motion.div>

      <Grid container spacing={3}>
        {/* Profile Settings */}
  <Grid size={{ xs: 12, md: 6 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardContent>
                <Box className="flex items-center gap-3 mb-6">
                  <PersonIcon className="text-blue-600 text-2xl" />
                  <Typography variant="h6" className="font-semibold">
                    Perfil do Usuário
                  </Typography>
                </Box>

                <Box className="flex flex-col items-center mb-6">
                  <Avatar
                    sx={{ width: 80, height: 80 }}
                    className="mb-3 border-4 border-gray-200"
                  >
                    <PersonIcon sx={{ fontSize: 40 }} />
                  </Avatar>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="profile-photo-upload"
                    type="file"
                  />
                  <label htmlFor="profile-photo-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<PhotoCameraIcon />}
                      size="small"
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      Alterar Foto
                    </Button>
                  </label>
                </Box>

                <Box className="space-y-4">
                  <TextField
                    fullWidth
                    label="ID do Usuário"
                    name="usuario_id"
                    value={profileData.usuario_id}
                    onChange={handleProfileChange}
                    variant="outlined"
                    disabled
                    helperText="O ID do usuário não pode ser alterado"
                  />

                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    variant="outlined"
                  />
                </Box>

                <Box className="mt-6">
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleSaveProfile}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? 'Salvando...' : 'Salvar Perfil'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Company Settings */}
  <Grid size={{ xs: 12, md: 6 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Box className="flex items-center gap-3 mb-6">
                  <BusinessIcon className="text-green-600 text-2xl" />
                  <Typography variant="h6" className="font-semibold">
                    Dados da Empresa
                  </Typography>
                </Box>

                <Box className="space-y-4">
                  <TextField
                    fullWidth
                    label="Nome da Empresa"
                    name="empresa_nome"
                    value={companyData.empresa_nome}
                    onChange={handleCompanyChange}
                    variant="outlined"
                  />

                  <TextField
                    fullWidth
                    label="CNPJ"
                    name="cnpj"
                    value={companyData.cnpj}
                    onChange={handleCompanyChange}
                    variant="outlined"
                    placeholder="00.000.000/0000-00"
                  />

                  <TextField
                    fullWidth
                    label="Endereço"
                    name="endereco"
                    value={companyData.endereco}
                    onChange={handleCompanyChange}
                    variant="outlined"
                    multiline
                    rows={2}
                  />

                  <TextField
                    fullWidth
                    label="Telefone"
                    name="telefone"
                    value={companyData.telefone}
                    onChange={handleCompanyChange}
                    variant="outlined"
                    placeholder="(00) 00000-0000"
                  />
                </Box>

                <Box className="mt-6">
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleSaveCompany}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? 'Salvando...' : 'Salvar Empresa'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Security Settings */}
  <Grid size={{ xs: 12, md: 6 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardContent>
                <Box className="flex items-center gap-3 mb-6">
                  <SecurityIcon className="text-red-600 text-2xl" />
                  <Typography variant="h6" className="font-semibold">
                    Segurança
                  </Typography>
                </Box>

                <Box className="space-y-4">
                  <TextField
                    fullWidth
                    label="Senha Atual"
                    name="senha_atual"
                    type="password"
                    value={securityData.senha_atual}
                    onChange={handleSecurityChange}
                    variant="outlined"
                  />

                  <TextField
                    fullWidth
                    label="Nova Senha"
                    name="nova_senha"
                    type="password"
                    value={securityData.nova_senha}
                    onChange={handleSecurityChange}
                    variant="outlined"
                  />

                  <TextField
                    fullWidth
                    label="Confirmar Nova Senha"
                    name="confirmar_senha"
                    type="password"
                    value={securityData.confirmar_senha}
                    onChange={handleSecurityChange}
                    variant="outlined"
                  />
                </Box>

                <Box className="mt-6">
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleChangePassword}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SecurityIcon />}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {loading ? 'Alterando...' : 'Alterar Senha'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Appearance Settings */}
  <Grid size={{ xs: 12, md: 6 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardContent>
                <Box className="flex items-center gap-3 mb-6">
                  <PaletteIcon className="text-purple-600 text-2xl" />
                  <Typography variant="h6" className="font-semibold">
                    Aparência
                  </Typography>
                </Box>

                <Box className="space-y-4">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={darkMode}
                        onChange={(e) => setDarkMode(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Modo Escuro"
                  />

                  <Alert severity="info" className="mt-4">
                    <Typography variant="body2">
                      O modo escuro será implementado em uma versão futura.
                    </Typography>
                  </Alert>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Danger Zone */}
  <Grid size={{ xs: 12 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="border-red-200">
              <CardContent>
                <Box className="flex items-center gap-3 mb-4">
                  <Typography variant="h6" className="font-semibold text-red-600">
                    Zona de Perigo
                  </Typography>
                </Box>

                <Divider className="mb-4" />

                <Box className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <Box>
                    <Typography variant="subtitle1" className="font-medium">
                      Sair da Conta
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                      Faça logout da sua conta atual
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleLogout}
                    className="border-red-600 text-red-600 hover:bg-red-50"
                  >
                    Sair
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
    </PageLayout>
  );
};

export default SettingsPage;
