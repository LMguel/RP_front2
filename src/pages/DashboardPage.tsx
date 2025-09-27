import React, { useState, useEffect } from 'react';
import PageLayout from '../sections/PageLayout';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People as PeopleIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_funcionarios: 0,
    total_registros_mes: 0,
    funcionarios_registrados_hoje: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load employees count
      const employeesResponse = await apiService.getEmployees();
      const totalEmployees = employeesResponse.funcionarios?.length || 0;

      // Load recent records
      const recordsResponse = await apiService.getTimeRecords();
      const records = Array.isArray(recordsResponse) ? recordsResponse : [];
      
      // Se não há registros com data, vamos considerar todos os registros como válidos
      const recordsWithoutDate = records.filter(r => !r.data_hora).length;
      const recordsWithDate = records.filter(r => r.data_hora).length;
      
      // Get current date in Brazil timezone
      const now = new Date();
      const brasiliaTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
      
      // Also try getting today's date from a simple Date() for comparison
      const simpleToday = new Date();
      const simpleDateStr = simpleToday.toISOString().split('T')[0]; // Format: "2025-09-26"
      
      const currentYear = brasiliaTime.getFullYear();
      const currentMonth = brasiliaTime.getMonth() + 1; // getMonth() returns 0-11
      const currentDay = brasiliaTime.getDate();
      
      const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
      const currentDateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;

      let monthlyRecords, todayRecords;

      if (recordsWithoutDate > recordsWithDate) {
        // Se a maioria dos registros não tem data, considerar todos como válidos
        monthlyRecords = records;
        todayRecords = records;
      } else {
        // Lógica normal de filtragem por data
        monthlyRecords = records.filter(record => {
          if (!record.data_hora) return false;
          
          let recordDate = '';
          
          // Handle different date formats
          if (record.data_hora.includes(' ')) {
            recordDate = record.data_hora.split(' ')[0];
          } else if (record.data_hora.includes('T')) {
            recordDate = record.data_hora.split('T')[0];
          } else {
            recordDate = record.data_hora;
          }
          
          return recordDate && recordDate.startsWith(currentMonthStr);
        });

        todayRecords = records.filter(record => {
          if (!record.data_hora) return false;
          
          let recordDate = '';
          
          if (record.data_hora.includes(' ')) {
            recordDate = record.data_hora.split(' ')[0];
          } else if (record.data_hora.includes('T')) {
            recordDate = record.data_hora.split('T')[0];
          } else {
            recordDate = record.data_hora;
          }
          
          const matchesBrasil = recordDate === currentDateStr;
          const matchesSimple = recordDate === simpleDateStr;
          
          return matchesBrasil || matchesSimple;
        });
      }
      
      // Get unique employees who registered today
      const uniqueEmployeeIds = [...new Set(todayRecords.map(record => record.funcionario_id || record.funcionario_nome))].filter(id => id);
      const uniqueEmployeesToday = uniqueEmployeeIds.length;

      setStats({
        total_funcionarios: totalEmployees,
        total_registros_mes: monthlyRecords.length,
        funcionarios_registrados_hoje: uniqueEmployeesToday,
      });

    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToTodayRecords = () => {
    // Navigate to records page 
    // If most records don't have dates, don't filter by date
    navigate('/records?tab=detailed');
  };

  if (loading) {
    return (
      <PageLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress sx={{ color: 'white' }} />
        </Box>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
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
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 600, 
              color: 'white', 
              mb: 1,
              fontSize: '28px'
            }}
          >
            Bem-vindo, {user?.empresa_nome}!
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '16px'
            }}
          >
            Aqui está um resumo das atividades da sua empresa
          </Typography>
        </Box>
      </motion.div>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card 
              sx={{
                height: '100%',
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.8)', 
                        fontSize: '14px',
                        mb: 1
                      }}
                    >
                      Funcionários
                    </Typography>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontWeight: 600, 
                        color: '#3b82f6',
                        fontSize: '32px'
                      }}
                    >
                      {stats.total_funcionarios}
                    </Typography>
                  </Box>
                  <PeopleIcon sx={{ color: '#3b82f6', fontSize: '32px' }} />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card 
              sx={{
                height: '100%',
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.8)', 
                        fontSize: '14px',
                        mb: 1
                      }}
                    >
                      Registros (Mês)
                    </Typography>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontWeight: 600, 
                        color: '#10b981',
                        fontSize: '32px'
                      }}
                    >
                      {stats.total_registros_mes}
                    </Typography>
                  </Box>
                  <AccessTimeIcon sx={{ color: '#10b981', fontSize: '32px' }} />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card 
              sx={{
                height: '100%',
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
                  background: 'rgba(255, 255, 255, 0.12)',
                },
              }}
              onClick={handleNavigateToTodayRecords}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.8)', 
                        fontSize: '14px',
                        mb: 1
                      }}
                    >
                      Registraram Hoje
                    </Typography>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontWeight: 600, 
                        color: '#8b5cf6',
                        fontSize: '32px'
                      }}
                    >
                      {stats.funcionarios_registrados_hoje}/{stats.total_funcionarios}
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ color: '#8b5cf6', fontSize: '32px' }} />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card 
              sx={{
                height: '100%',
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.8)', 
                        fontSize: '14px',
                        mb: 1
                      }}
                    >
                      Empresa
                    </Typography>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontWeight: 600, 
                        color: '#f59e0b',
                        fontSize: '32px'
                      }}
                    >
                      {user?.empresa_nome?.slice(0, 3).toUpperCase()}
                    </Typography>
                  </Box>
                  <BusinessIcon sx={{ color: '#f59e0b', fontSize: '32px' }} />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </PageLayout>
  );
};

export default DashboardPage;
