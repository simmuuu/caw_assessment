import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Button,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Badge,
  IconButton,
  useDisclosure,
  useToast,
  Flex,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Center,
  useColorModeValue,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, SearchIcon } from '@chakra-ui/icons';
import { expenseAPI, Expense } from '../utils/api';
import ExpenseForm from '../components/ExpenseForm';

const Dashboard: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState<Expense | undefined>();
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | undefined>();
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const toast = useToast();
  const cancelRef = React.useRef(null);

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const categories = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Travel',
    'Education',
    'Other',
  ];

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await expenseAPI.getAll();
      setExpenses(data);
      setFilteredExpenses(data);
    } catch (error: any) {
      toast({
        title: 'Error loading expenses',
        description: error.response?.data?.error || 'Something went wrong',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  useEffect(() => {
    let filtered = expenses;

    if (categoryFilter) {
      filtered = filtered.filter(expense => expense.category === categoryFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (dateFilter) {
      filtered = filtered.filter(expense => expense.date === dateFilter);
    }

    setFilteredExpenses(filtered);
  }, [expenses, categoryFilter, searchTerm, dateFilter]);

  const handleAddExpense = () => {
    setSelectedExpense(undefined);
    onOpen();
  };

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    onOpen();
  };

  const handleDeleteClick = (expense: Expense) => {
    setExpenseToDelete(expense);
    onDeleteOpen();
  };

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return;

    try {
      await expenseAPI.delete(expenseToDelete.id);
      toast({
        title: 'Expense deleted successfully',
        status: 'success',
        duration: 3000,
      });
      loadExpenses();
    } catch (error: any) {
      toast({
        title: 'Error deleting expense',
        description: error.response?.data?.error || 'Something went wrong',
        status: 'error',
        duration: 5000,
      });
    } finally {
      onDeleteClose();
      setExpenseToDelete(undefined);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTotalAmount = () => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const clearFilters = () => {
    setCategoryFilter('');
    setSearchTerm('');
    setDateFilter('');
  };

  if (loading) {
    return (
      <Center minH="50vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Container maxW="6xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Heading size="lg">Expense Dashboard</Heading>
          <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleAddExpense}>
            Add Expense
          </Button>
        </Flex>

        {/* Filters */}
        <Box bg={bg} p={4} borderRadius="md" borderWidth={1} borderColor={borderColor}>
          <VStack spacing={4}>
            <HStack w="100%" spacing={4} wrap="wrap">
              <InputGroup maxW="300px">
                <InputLeftElement>
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              <Select
                placeholder="All Categories"
                maxW="200px"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>

              <Input
                type="date"
                maxW="200px"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />

              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </HStack>

            <HStack w="100%" justify="space-between">
              <Text color="gray.500">
                Showing {filteredExpenses.length} of {expenses.length} expenses
              </Text>
              <Text fontSize="lg" fontWeight="bold">
                Total: {formatCurrency(getTotalAmount())}
              </Text>
            </HStack>
          </VStack>
        </Box>

        {/* Expenses Table */}
        <Box bg={bg} borderRadius="md" borderWidth={1} borderColor={borderColor} overflow="hidden">
          {filteredExpenses.length === 0 ? (
            <Center p={8}>
              <Text color="gray.500">
                {expenses.length === 0 ? 'No expenses yet. Add your first expense!' : 'No expenses match your filters.'}
              </Text>
            </Center>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Category</Th>
                  <Th>Description</Th>
                  <Th isNumeric>Amount</Th>
                  <Th width="100px">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredExpenses.map((expense) => (
                  <Tr key={expense.id}>
                    <Td>{formatDate(expense.date)}</Td>
                    <Td>
                      <Badge colorScheme="blue" variant="subtle">
                        {expense.category}
                      </Badge>
                    </Td>
                    <Td>{expense.description || '-'}</Td>
                    <Td isNumeric fontWeight="bold">
                      {formatCurrency(expense.amount)}
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Edit expense"
                          icon={<EditIcon />}
                          size="sm"
                          variant="ghost"
                          colorScheme="blue"
                          onClick={() => handleEditExpense(expense)}
                        />
                        <IconButton
                          aria-label="Delete expense"
                          icon={<DeleteIcon />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleDeleteClick(expense)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>
      </VStack>

      <ExpenseForm
        isOpen={isOpen}
        onClose={onClose}
        expense={selectedExpense}
        onSuccess={loadExpenses}
      />

      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Expense
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteConfirm} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
};

export default Dashboard;