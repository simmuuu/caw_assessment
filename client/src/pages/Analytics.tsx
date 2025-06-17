import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  GridItem,
  Text,
  useColorModeValue,
  Spinner,
  Center,
  useToast,
  Button,
  Icon,
} from '@chakra-ui/react';
import { FiDownload } from 'react-icons/fi';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { expenseAPI, Analytics } from '../utils/api';

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const categoryItemBg = useColorModeValue('gray.50', 'gray.700');

  // Colors for charts
  const colors = [
    '#3182CE', '#38A169', '#D69E2E', '#E53E3E', '#805AD5',
    '#DD6B20', '#319795', '#C53030', '#9F7AEA', '#2B6CB0'
  ];

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await expenseAPI.getAnalytics();
      setAnalytics(data);
    } catch (error: any) {
      toast({
        title: 'Error loading analytics',
        description: error.response?.data?.error || 'Something went wrong',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  const exportToCSV = () => {
    if (!analytics) return;

    // Prepare CSV data
    const csvData = [
      ['Date', 'Category', 'Description', 'Amount'],
      ...analytics.recentExpenses.map(expense => [
        new Date(expense.date).toLocaleDateString(),
        expense.category,
        expense.description || '',
        expense.amount.toString()
      ])
    ];

    // Convert to CSV string
    const csvString = csvData
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Export successful',
      description: 'Your expenses have been exported to CSV',
      status: 'success',
      duration: 3000,
    });
  };

  if (loading) {
    return (
      <Center minH="50vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!analytics) {
    return (
      <Center minH="50vh">
        <Text>No analytics data available</Text>
      </Center>
    );
  }

  // Prepare data for charts
  const categoryData = analytics.categoryBreakdown.map((item, index) => ({
    ...item,
    color: colors[index % colors.length]
  }));

  const monthlyData = analytics.monthlySpending.map(item => ({
    ...item,
    month: formatMonth(item.month)
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box bg={bg} p={3} borderRadius="md" borderWidth={1} borderColor={borderColor}>
          <Text fontWeight="bold">{label}</Text>
          <Text color="blue.500">
            Amount: {formatCurrency(payload[0].value)}
          </Text>
          {payload[0].payload.count && (
            <Text color={textColor}>
              Transactions: {payload[0].payload.count}
            </Text>
          )}
        </Box>
      );
    }
    return null;
  };

  return (
    <Container maxW="6xl" py={8}>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading size="lg">Analytics Dashboard</Heading>
          <Button
            leftIcon={<Icon as={FiDownload} />}
            colorScheme="blue"
            onClick={exportToCSV}
            isDisabled={!analytics || analytics.recentExpenses.length === 0}
          >
            Export CSV
          </Button>
        </HStack>

        {/* Overview Stats */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
          <GridItem>
            <Box bg={bg} p={6} borderRadius="md" borderWidth={1} borderColor={borderColor}>
              <Stat>
                <StatLabel>Total Expenses</StatLabel>
                <StatNumber fontSize="2xl">{formatCurrency(analytics.total)}</StatNumber>
                <StatHelpText>All time spending</StatHelpText>
              </Stat>
            </Box>
          </GridItem>
          
          <GridItem>
            <Box bg={bg} p={6} borderRadius="md" borderWidth={1} borderColor={borderColor}>
              <Stat>
                <StatLabel>Categories</StatLabel>
                <StatNumber fontSize="2xl">{analytics.categoryBreakdown.length}</StatNumber>
                <StatHelpText>Different categories used</StatHelpText>
              </Stat>
            </Box>
          </GridItem>

          <GridItem>
            <Box bg={bg} p={6} borderRadius="md" borderWidth={1} borderColor={borderColor}>
              <Stat>
                <StatLabel>Recent Expenses</StatLabel>
                <StatNumber fontSize="2xl">{analytics.recentExpenses.length}</StatNumber>
                <StatHelpText>In the last 10 transactions</StatHelpText>
              </Stat>
            </Box>
          </GridItem>
        </Grid>

        {/* Charts */}
        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={8}>
          {/* Category Breakdown Pie Chart */}
          <GridItem>
            <Box bg={bg} p={6} borderRadius="md" borderWidth={1} borderColor={borderColor}>
              <Heading size="md" mb={4}>Spending by Category</Heading>
              {categoryData.length > 0 ? (
                <Box h="400px">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="total"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Center h="400px">
                  <Text color={textColor}>No category data available</Text>
                </Center>
              )}
            </Box>
          </GridItem>

          {/* Monthly Spending Bar Chart */}
          <GridItem>
            <Box bg={bg} p={6} borderRadius="md" borderWidth={1} borderColor={borderColor}>
              <Heading size="md" mb={4}>Monthly Spending Trend</Heading>
              {monthlyData.length > 0 ? (
                <Box h="400px">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${value}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="total" fill="#3182CE" name="Amount Spent" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Center h="400px">
                  <Text color={textColor}>No monthly data available</Text>
                </Center>
              )}
            </Box>
          </GridItem>
        </Grid>

        {/* Category Breakdown Table */}
        {categoryData.length > 0 && (
          <Box bg={bg} p={6} borderRadius="md" borderWidth={1} borderColor={borderColor}>
            <Heading size="md" mb={4}>Category Details</Heading>
            <VStack spacing={4} align="stretch">
              {categoryData.map((category, index) => (
                <HStack key={category.category} justify="space-between" p={3} bg={categoryItemBg} borderRadius="md">
                  <HStack>
                    <Box w={4} h={4} bg={category.color} borderRadius="sm" />
                    <Text fontWeight="medium">{category.category}</Text>
                  </HStack>
                  <VStack spacing={0} align="end">
                    <Text fontWeight="bold">{formatCurrency(category.total)}</Text>
                    <Text fontSize="sm" color={textColor}>
                      {category.count} transaction{category.count !== 1 ? 's' : ''}
                    </Text>
                  </VStack>
                </HStack>
              ))}
            </VStack>
          </Box>
        )}

        {/* Recent Expenses */}
        {analytics.recentExpenses.length > 0 && (
          <Box bg={bg} p={6} borderRadius="md" borderWidth={1} borderColor={borderColor}>
            <Heading size="md" mb={4}>Recent Expenses</Heading>
            <VStack spacing={3} align="stretch">
              {analytics.recentExpenses.slice(0, 5).map((expense) => (
                <HStack key={expense.id} justify="space-between" p={3} bg={categoryItemBg} borderRadius="md">
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="medium">{expense.category}</Text>
                    <Text fontSize="sm" color={textColor}>
                      {expense.description || 'No description'}
                    </Text>
                    <Text fontSize="xs" color={textColor}>
                      {new Date(expense.date).toLocaleDateString()}
                    </Text>
                  </VStack>
                  <Text fontWeight="bold" fontSize="lg">
                    {formatCurrency(expense.amount)}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        )}
      </VStack>
    </Container>
  );
};

export default Analytics;