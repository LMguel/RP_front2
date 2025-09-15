import React, { useState, useEffect } from 'react';
import PageLayout from '../sections/PageLayout';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People as PeopleIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { TimeRecord, HoursWorked } from '../types';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_funcionarios: 0,
    total_registros_mes: 0,
    funcionarios_ativos: 0,
  });
  const [recentRecords, setRecentRecords] = useState<TimeRecord[]>([]);
  const [hoursData, setHoursData] = useState<HoursWorked[]>([]);
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
      
      // Calculate monthly records
      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthlyRecords = records.filter(record => 
        record.data_hora && record.data_hora.startsWith(currentMonth)
      );

      // Load hours worked data
      const hoursResponse = await apiService.getTimeRecords();
      const hoursData = Array.isArray(hoursResponse) ? hoursResponse : [];

      setStats({
        total_funcionarios: totalEmployees,
        total_registros_mes: monthlyRecords.length,
        funcionarios_ativos: totalEmployees, // Simplified for now
      });

      setRecentRecords(records.slice(0, 10));
      setHoursData(hoursData);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const [date, time] = timeString.split(' ');
      return time || timeString;
    } catch {
      return timeString;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const [date, time] = dateString.split(' ');
      return date || dateString;
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (tipo: string) => {
    return tipo === 'entrada' ? 'success' : 'error';
  };

  const getStatusText = (tipo: string) => {
    return tipo === 'entrada' ? 'Entrada' : 'Saída';
  };

  // Prepare chart data
  const chartData = hoursData.slice(0, 5).map(item => ({
    name: item.funcionario,
    horas: parseFloat(item.horas_trabalhadas.split(':')[0]) || 0,
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <PageLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Box className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" className="font-bold text-gray-800 mb-2">
          Bem-vindo, {user?.empresa_nome}!
        </Typography>
        <Typography variant="body1" className="text-gray-600">
          Aqui está um resumo das atividades da sua empresa
        </Typography>
      </motion.div>

      {/* Stats Cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="h-full">
              <CardContent>
                <Box className="flex items-center justify-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="h6">
                      Funcionários
                    </Typography>
                    <Typography variant="h4" className="font-bold text-blue-600">
                      {stats.total_funcionarios}
                    </Typography>
                  </Box>
                  <PeopleIcon className="text-blue-600 text-4xl" />
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
            <Card className="h-full">
              <CardContent>
                <Box className="flex items-center justify-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="h6">
                      Registros (Mês)
                    </Typography>
                    <Typography variant="h4" className="font-bold text-green-600">
                      {stats.total_registros_mes}
                    </Typography>
                  </Box>
                  <AccessTimeIcon className="text-green-600 text-4xl" />
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
            <Card className="h-full">
              <CardContent>
                <Box className="flex items-center justify-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="h6">
                      Ativos Hoje
                    </Typography>
                    <Typography variant="h4" className="font-bold text-purple-600">
                      {stats.funcionarios_ativos}
                    </Typography>
                  </Box>
                  <TrendingUpIcon className="text-purple-600 text-4xl" />
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
            <Card className="h-full">
              <CardContent>
                <Box className="flex items-center justify-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="h6">
                      Empresa
                    </Typography>
                    <Typography variant="h4" className="font-bold text-orange-600">
                      {user?.empresa_nome?.slice(0, 3).toUpperCase()}
                    </Typography>
                  </Box>
                  <BusinessIcon className="text-orange-600 text-4xl" />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" className="font-semibold mb-4">
                  Horas Trabalhadas por Funcionário
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="horas" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" className="font-semibold mb-4">
                  Distribuição de Registros
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Entradas', value: recentRecords.filter(r => r.tipo === 'entrada').length },
                        { name: 'Saídas', value: recentRecords.filter(r => r.tipo === 'saída').length },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Recent Records Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <Card>
          <CardContent>
            <Typography variant="h6" className="font-semibold mb-4">
              Registros Recentes
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Funcionário</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell>Hora</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentRecords.length > 0 ? (
                    recentRecords.map((record) => (
                      <TableRow key={record.registro_id}>
                        <TableCell>{record.funcionario_nome || 'N/A'}</TableCell>
                        <TableCell>{formatDate(record.data_hora)}</TableCell>
                        <TableCell>{formatTime(record.data_hora)}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusText(record.tipo)}
                            color={getStatusColor(record.tipo) as any}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography variant="body2" color="textSecondary">
                          Nenhum registro encontrado
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
    </PageLayout>
  );
};

export default DashboardPage;
