import React, { useState, useEffect, useCallback } from 'react'; // version ^18.2.0
import { useDispatch, useSelector } from 'react-redux'; // version ^8.0.5
import styled from 'styled-components'; // version ^5.3.6

import DataTable from '../../../../shared/components/tables/DataTable';
import Button from '../../../../shared/components/buttons/Button';
import Modal from '../../../../shared/components/feedback/Modal';
import Input from '../../../../shared/components/forms/Input';
import Select from '../../../../shared/components/forms/Select';
import { 
  User, 
  UserType, 
  UserStatus, 
  Role, 
  UserCreationParams, 
  UserUpdateParams 
} from '../../../../common/interfaces/user.interface';
import settingsService from '../../services/settingsService';
import { 
  fetchUsers, 
  createUser, 
  updateUserRole as updateUser, 
  deleteUser, 
  fetchRoles 
} from '../../store/actions/settingsActions';

// Define styled components for layout and styling
const Container = styled.div`
  padding: 24px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #202124;
  margin: 0;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const FormRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

const ActionCell = styled.div`
  display: flex;
  gap: 8px;
`;

// Define constants for initial form data and options
const INITIAL_FORM_DATA = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  userType: 'CARRIER_STAFF' as UserType,
  status: 'ACTIVE' as UserStatus,
  roles: [] as string[],
};

const USER_TYPE_OPTIONS = [
  { value: 'CARRIER_ADMIN', label: 'Carrier Administrator' },
  { value: 'CARRIER_STAFF', label: 'Carrier Staff' },
];

const USER_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

// Define column definitions for the data table
const COLUMN_DEFINITIONS = [
  { field: 'firstName', header: 'First Name', sortable: true },
  { field: 'lastName', header: 'Last Name', sortable: true },
  { field: 'email', header: 'Email', sortable: true },
  { 
    field: 'userType', 
    header: 'User Type', 
    sortable: true,
    renderCell: (user: User) => {
      const userType = USER_TYPE_OPTIONS.find(option => option.value === user.userType);
      return userType ? userType.label : 'Unknown';
    }
  },
  { 
    field: 'status', 
    header: 'Status', 
    sortable: true,
    renderCell: (user: User) => {
      const userStatus = USER_STATUS_OPTIONS.find(option => option.value === user.status);
      return userStatus ? userStatus.label : 'Unknown';
    }
  },
  { 
    field: 'actions', 
    header: 'Actions', 
    sortable: false,
    renderCell: (user: User) => (
      <ActionCell>
        <Button variant="secondary" size="small" onClick={() => openEditModal(user)}>Edit</Button>
        <Button variant="danger" size="small" onClick={() => openDeleteModal(user)}>Delete</Button>
      </ActionCell>
    )
  },
];

/**
 * Main component for user management functionality
 */
const UserManagement: React.FC = () => {
  // Initialize state variables
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserCreationParams>(INITIAL_FORM_DATA);

  // Get dispatch and users from Redux store
  const dispatch = useDispatch();
  const reduxUsers = useSelector((state: any) => state.settings.users);

  // Fetch users and roles on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Dispatch fetchUsers and fetchRoles actions
        await dispatch(fetchUsers({}));
        await dispatch(fetchRoles());
      } catch (error) {
        console.error("Failed to fetch users or roles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch]);

  // Update local users state when Redux users state changes
  useEffect(() => {
    if (reduxUsers) {
      setUsers(reduxUsers);
    }
  }, [reduxUsers]);

  // Define event handlers for form actions
  const handleCreateUser = async (userData: UserCreationParams) => {
    try {
      await dispatch(createUser(userData));
      setCreateModalOpen(false);
      setFormData(INITIAL_FORM_DATA);
    } catch (error) {
      console.error("Failed to create user:", error);
    }
  };

  const handleUpdateUser = async (userId: string, userData: UserUpdateParams) => {
    try {
      await dispatch(updateUser(userId, userData));
      setEditModalOpen(false);
      setFormData(INITIAL_FORM_DATA);
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await dispatch(deleteUser(userId));
      setDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  // Define functions to open modals
  const openCreateModal = () => {
    setFormData(INITIAL_FORM_DATA);
    setCreateModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      userType: user.userType,
      status: user.status,
      roles: user.roles,
    });
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  // Define function to handle form input changes
  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <Container>
      <Header>
        <Title>User Management</Title>
        <Button variant="primary" onClick={openCreateModal}>Add User</Button>
      </Header>
      <DataTable 
        data={users}
        columns={COLUMN_DEFINITIONS}
        loading={loading}
      />

      {/* Create User Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New User"
      >
        <FormGroup>
          <Input
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleFormChange}
            required
          />
        </FormGroup>
        <FormGroup>
          <Input
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleFormChange}
            required
          />
        </FormGroup>
        <FormGroup>
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleFormChange}
            required
          />
        </FormGroup>
        <FormGroup>
          <Input
            label="Phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleFormChange}
          />
        </FormGroup>
        <FormGroup>
          <Select
            label="User Type"
            name="userType"
            options={USER_TYPE_OPTIONS}
            value={formData.userType}
            onChange={handleFormChange}
            required
          />
        </FormGroup>
        <FormGroup>
          <Select
            label="Status"
            name="status"
            options={USER_STATUS_OPTIONS}
            value={formData.status}
            onChange={handleFormChange}
            required
          />
        </FormGroup>
        <FormActions>
          <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => handleCreateUser(formData)}>Create</Button>
        </FormActions>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit User"
      >
        <FormGroup>
          <Input
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleFormChange}
            required
          />
        </FormGroup>
        <FormGroup>
          <Input
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleFormChange}
            required
          />
        </FormGroup>
        <FormGroup>
          <Input
            label="Phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleFormChange}
          />
        </FormGroup>
        <FormGroup>
          <Select
            label="User Type"
            name="userType"
            options={USER_TYPE_OPTIONS}
            value={formData.userType}
            onChange={handleFormChange}
            required
          />
        </FormGroup>
        <FormGroup>
          <Select
            label="Status"
            name="status"
            options={USER_STATUS_OPTIONS}
            value={formData.status}
            onChange={handleFormChange}
            required
          />
        </FormActions>
          <Button variant="secondary" onClick={() => setEditModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => handleUpdateUser(selectedUser.id, formData)}>Update</Button>
        </FormActions>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <p>Are you sure you want to delete {selectedUser?.firstName} {selectedUser?.lastName}?</p>
        <FormActions>
          <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => handleDeleteUser(selectedUser.id)}>Delete</Button>
        </FormActions>
      </Modal>
    </Container>
  );
};

export default UserManagement;