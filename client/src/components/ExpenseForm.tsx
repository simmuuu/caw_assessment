import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  VStack,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  NumberInput,
  NumberInputField,
} from '@chakra-ui/react';
import { expenseAPI, Expense } from '../utils/api';

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  expense?: Expense;
  onSuccess: () => void;
}

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

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  isOpen,
  onClose,
  expense,
  onSuccess,
}) => {
  const [amount, setAmount] = useState(expense?.amount?.toString() || '');
  const [category, setCategory] = useState(expense?.category || categories[0]);
  const [description, setDescription] = useState(expense?.description || '');
  const [date, setDate] = useState(expense?.date || new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const expenseData = {
        amount: parseFloat(amount),
        category,
        description,
        date,
      };

      if (expense) {
        await expenseAPI.update(expense.id, expenseData);
        toast({
          title: 'Expense updated successfully',
          status: 'success',
          duration: 3000,
        });
      } else {
        await expenseAPI.create(expenseData);
        toast({
          title: 'Expense created successfully',
          status: 'success',
          duration: 3000,
        });
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Something went wrong',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setCategory(categories[0]);
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleClose = () => {
    onClose();
    if (!expense) {
      resetForm();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {expense ? 'Edit Expense' : 'Add New Expense'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Box as="form" onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Amount</FormLabel>
                <NumberInput min={0} precision={2}>
                  <NumberInputField
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </NumberInput>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Category</FormLabel>
                <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={3}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                w="100%"
                isLoading={loading}
                loadingText={expense ? 'Updating...' : 'Creating...'}
              >
                {expense ? 'Update Expense' : 'Create Expense'}
              </Button>
            </VStack>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ExpenseForm;