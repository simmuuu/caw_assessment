import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Button,
  useColorMode,
  useColorModeValue,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
} from '@chakra-ui/react';
import { MoonIcon, SunIcon, HamburgerIcon } from '@chakra-ui/icons';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box bg={bg} borderBottom="1px" borderColor={borderColor} px={4}>
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <Heading as={RouterLink} to="/dashboard" size="md" color="blue.500">
          VibeCoded ExpenseTracker
        </Heading>

        <Flex alignItems="center" gap={4}>
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            variant="ghost"
          />

          {isAuthenticated ? (
            <Menu>
              <MenuButton as={Button} variant="ghost" rightIcon={<HamburgerIcon />}>
                <Avatar size="sm" name={user?.email} />
              </MenuButton>
              <MenuList>
                <MenuItem as={RouterLink} to="/dashboard">
                  Dashboard
                </MenuItem>
                <MenuItem as={RouterLink} to="/analytics">
                  Analytics
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  Logout
                </MenuItem>
              </MenuList>
            </Menu>
          ) : (
            <Flex gap={2}>
              <Button as={RouterLink} to="/login" variant="ghost">
                Login
              </Button>
              <Button as={RouterLink} to="/register" colorScheme="blue">
                Sign Up
              </Button>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

export default Navbar;