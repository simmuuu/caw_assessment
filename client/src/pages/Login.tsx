import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Alert,
  AlertIcon,
  Link,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="md" centerContent minH="100vh" display="flex" alignItems="center">
      <Box
        w="100%"
        p={8}
        borderWidth={1}
        borderRadius="lg"
        borderColor={borderColor}
        bg={bg}
        boxShadow="lg"
      >
        <VStack spacing={6}>
          <Heading size="lg" textAlign="center">
            Welcome Back
          </Heading>
          <Text color="gray.500" textAlign="center">
            Sign in to your expense tracker account
          </Text>

          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <Box as="form" onSubmit={handleSubmit} w="100%">
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                w="100%"
                isLoading={loading}
                loadingText="Signing in..."
              >
                Sign In
              </Button>
            </VStack>
          </Box>

          <Text>
            Don't have an account?{' '}
            <Link as={RouterLink} to="/register" color="blue.500">
              Sign up here
            </Link>
          </Text>
        </VStack>
      </Box>
    </Container>
  );
};

export default Login;