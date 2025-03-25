# src/web/shipper-portal/src/components/settings/UserManagement.tsx
```typescript
import React, { useState, useEffect, useCallback } from 'react'; // react ^18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6
import { Add, Edit, Delete, CheckCircle, Block } from '@mui/icons-material'; // @mui/icons-material ^5.11.0

import { 
  User, 
  UserType, 
  UserStatus, 
  UserInviteParams 
} from '../../../common/interfaces/user.interface';
import settingsService from '../../../services/settingsService';
import DataTable, { 
  ColumnDefinition, 
  SortDirection 
} from '../../../shared/components/tables/DataTable';
import Input from '../../../shared/components/forms/Input';
import Select from '../../../shared/components/forms/Select';
import Button from '../../../shared/components/buttons/Button';
import Modal from '../../../shared/components/feedback/Modal';
import Alert from '../../../shared/components/feedback/Alert';
import { useAuth } from '../../../common/hooks/useAuth';

/**
 * Interface for user invitation form data
 */
interface InviteFormData {
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
}

/**
 * Interface for user filter values
 */
interface FilterValues {
  search: string;
  userType: string;
  status: string;
}

/**
 * Interface for alert state
 */
interface AlertState {
  type: 'success' | 'error';
  message: string;
  visible: boolean;
}

/**
 * Options for user type selection in filters and forms
 */
const USER_TYPE_OPTIONS = [
  { value: 'SHIPPER_ADMIN', label: 'Administrator' },
  { value: 'SHIPPER_STAFF', label: 'Staff' },
];

/**
 * Options for user status selection in filters
 */
const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

/**
 * Options for role selection in forms
 */
const ROLE_OPTIONS = [
  { value: 'shipper_admin', label: 'Administrator' },
  { value: 'shipper_coordinator', label: 'Shipping Coordinator' },
  { value: 'shipper_viewer', label: 'Viewer' },
];

/**
 * Initial pagination settings
 */
const INITIAL_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
};

/**
 * Initial filter values
 */
const INITIAL_FILTERS = {
  search: '',
  userType: '',
  status: '',
};

/**
 * Color mapping for user status badges
 */
const STATUS_COLORS = {
  ACTIVE: '#34A853',
  INACTIVE: '#EA4335',
  PENDING: '#FBBC04',
  SUSPENDED: '#EA4335',
  LOCKED: '#EA4335',
};

/**
 * Main container for the user management component
 */
const Container = styled.div`
  padding: 24px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

/**
 * Header section with title and action buttons
 */
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

/**
 * Title for the user management section
 */
const Title = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #202124;
  margin: 0;
`;

/**
 * Container for filter controls
 */
const FilterContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

/**
 * Individual filter control item
 */
const FilterItem = styled.div`
  flex: 1;
  min-width: 200px;
`;

/**
 * Container for action buttons
 */
const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

/**
 * Form field group
 */
const FormGroup = styled.div`
  margin-bottom: 16px;
`;

/**
 * Container for modal action buttons
 */
const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

/**
 * Badge for user status
 */
const StatusBadge = styled.span<{ color: string }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${props => props.color}20;
  color: ${props => props.color};
`;

/**
 * Container for row action buttons
 */
const ActionsContainer = styled.div`
  display: flex;
  gap: 8px;
`;

/**
 * Container for alert messages
 */
const AlertContainer = styled.div`
  margin-bottom: 16px;
`;

/**
 * Main component for managing users within the shipper organization
 */
const UserManagement: React.FC = () => {
  // LD1: Get current user and shipper information from auth context
  const { authState } = useAuth();
  const shipperId = authState.user?.shipperId;

  // LD1: Initialize state for users, loading status, pagination, and filters
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [filters, setFilters] = useState<FilterValues>(INITIAL_FILTERS);

  // LD1: Initialize state for modals (invite user, edit role)
  const [inviteUserModalOpen, setInviteUserModalOpen] = useState(false);
  const [editRoleModalOpen, setEditRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // LD1: Initialize state for form data and alerts
  const [inviteFormData, setInviteFormData] = useState<InviteFormData>({
    email: '',
    firstName: '',
    lastName: '',
    roleId: ROLE_OPTIONS[0].value,
  });
  const [alert, setAlert] = useState<AlertState>({
    type: 'success',
    message: '',
    visible: false,
  });

  /**
   * Fetches users based on current pagination and filter settings
   */
  const fetchUsers = useCallback(async () => {
    // LD1: Set loading state to true
    setLoading(true);
    try {
      if (!shipperId) {
        throw new Error('Shipper ID is missing');
      }
      // LD1: Prepare query parameters with pagination and filter settings
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        userType: filters.userType,
        status: filters.status,
      };

      // LD1: Call settingsService.getUserList with shipper ID and query parameters
      const response = await settingsService.getUserList(shipperId, queryParams);

      // LD1: Update users state with the response data
      setUsers(response.users);

      // LD1: Update total items count for pagination
      setPagination((prev) => ({ ...prev, total: response.total }));
    } catch (error: any) {
      // LD1: Handle any errors and display error alert
      setAlert({ type: 'error', message: error.message, visible: true });
    } finally {
      // LD1: Set loading state to false
      setLoading(false);
    }
  }, [shipperId, pagination.page, pagination.limit, filters]);

  /**
   * Handles the submission of the invite user form
   */
  const handleInviteUser = useCallback(async () => {
    // LD1: Prevent default form submission behavior
    // LD1: Validate form data for required fields
    // LD1: Set form submission loading state
    try {
      if (!shipperId) {
        throw new Error('Shipper ID is missing');
      }
      // LD1: Prepare invitation parameters from form data
      const inviteParams: UserInviteParams = {
        email: inviteFormData.email,
        firstName: inviteFormData.firstName,
        lastName: inviteFormData.lastName,
        roleId: inviteFormData.roleId,
      };

      // LD1: Call settingsService.inviteUser with shipper ID and invitation parameters
      await settingsService.inviteUser(shipperId, inviteParams);

      // LD1: Display success alert on successful invitation
      setAlert({ type: 'success', message: 'User invited successfully', visible: true });

      // LD1: Close the invitation modal
      setInviteUserModalOpen(false);

      // LD1: Reset form data
      setInviteFormData({
        email: '',
        firstName: '',
        lastName: '',
        roleId: ROLE_OPTIONS[0].value,
      });

      // LD1: Refresh the user list
      await fetchUsers();
    } catch (error: any) {
      // LD1: Handle any errors and display error alert
      setAlert({ type: 'error', message: error.message, visible: true });
    } finally {
      // LD1: Reset form submission loading state
    }
  }, [shipperId, inviteFormData, fetchUsers]);

  /**
   * Handles updating a user's role
   */
  const handleUpdateRole = useCallback(async () => {
    // LD1: Prevent default form submission behavior
    // LD1: Validate selected role
    // LD1: Set form submission loading state
    try {
      if (!selectedUser) {
        throw new Error('No user selected');
      }
      if (!inviteFormData.roleId) {
        throw new Error('No role selected');
      }
      // LD1: Call settingsService.updateUserRole with user ID and role ID
      await settingsService.updateUserRole(selectedUser.id, inviteFormData.roleId);

      // LD1: Display success alert on successful update
      setAlert({ type: 'success', message: 'User role updated successfully', visible: true });

      // LD1: Close the edit role modal
      setEditRoleModalOpen(false);

      // LD1: Refresh the user list
      await fetchUsers();
    } catch (error: any) {
      // LD1: Handle any errors and display error alert
      setAlert({ type: 'error', message: error.message, visible: true });
    } finally {
      // LD1: Reset form submission loading state
    }
  }, [selectedUser, inviteFormData.roleId, fetchUsers]);

  /**
   * Handles deactivating a user
   */
  const handleDeactivateUser = useCallback(async (userId: string) => {
    try {
      // LD1: Call settingsService.deactivateUser with user ID
      await settingsService.deactivateUser(userId);

      // LD1: Display success alert on successful deactivation
      setAlert({ type: 'success', message: 'User deactivated successfully', visible: true });

      // LD1: Refresh the user list
      await fetchUsers();
    } catch (error: any) {
      // LD1: Handle any errors and display error alert
      setAlert({ type: 'error', message: error.message, visible: true });
    }
  }, [fetchUsers]);

  /**
   * Handles reactivating a user
   */
  const handleReactivateUser = useCallback(async (userId: string) => {
    try {
      // LD1: Call settingsService.reactivateUser with user ID
      await settingsService.reactivateUser(userId);

      // LD1: Display success alert on successful reactivation
      setAlert({ type: 'success', message: 'User reactivated successfully', visible: true });

      // LD1: Refresh the user list
      await fetchUsers();
    } catch (error: any) {
      // LD1: Handle any errors and display error alert
      setAlert({ type: 'error', message: error.message, visible: true });
    }
  }, [fetchUsers]);

  /**
   * Handles pagination page changes
   */
  const handlePageChange = useCallback((page: number) => {
    // LD1: Update current page in state
    setPagination((prev) => ({ ...prev, page }));
    // LD1: This will trigger a re-fetch of users with the new page
  }, []);

  /**
   * Handles changes to filter values
   */
  const handleFilterChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    // LD1: Extract field name and value from event
    const { name, value } = event.target;

    // LD1: Update filters state with new value
    setFilters((prev) => ({ ...prev, [name]: value }));

    // LD1: Reset to first page when filters change
    setPagination((prev) => ({ ...prev, page: 1 }));
    // LD1: This will trigger a re-fetch of users with the new filters
  }, []);

  /**
   * Renders the user type cell in the data table
   */
  const renderUserTypeCell = (user: User): string => {
    // LD1: Map UserType enum value to a user-friendly display string
    switch (user.userType) {
      case UserType.SHIPPER_ADMIN:
        return 'Administrator';
      case UserType.SHIPPER_STAFF:
        return 'Staff';
      default:
        return 'Unknown';
    }
  };

  /**
   * Renders the status cell in the data table
   */
  const renderStatusCell = (user: User): JSX.Element => {
    // LD1: Determine status color based on UserStatus value
    const statusColor = STATUS_COLORS[user.status] || STATUS_COLORS.INACTIVE;

    // LD1: Return a styled status indicator with appropriate color and text
    return <StatusBadge color={statusColor}>{user.status}</StatusBadge>;
  };

  /**
   * Renders the actions cell in the data table
   */
  const renderActionsCell = (user: User): JSX.Element => {
    // LD1: Check if the current user can perform actions on this user
    const canEdit = authState.user?.id !== user.id;

    return (
      <ActionsContainer>
        {canEdit && (
          <>
            {/* LD1: Render Edit Role button that opens the edit role modal */}
            <Button
              variant="secondary"
              size="small"
              onClick={() => {
                setSelectedUser(user);
                setInviteFormData((prev) => ({ ...prev, roleId: user.roles[0] }));
                setEditRoleModalOpen(true);
              }}
              aria-label={`Edit role for ${user.firstName} ${user.lastName}`}
            >
              <Edit />
              Edit Role
            </Button>

            {/* LD1: Render Deactivate/Reactivate button based on current user status */}
            {user.status === UserStatus.ACTIVE ? (
              <Button
                variant="danger"
                size="small"
                onClick={() => handleDeactivateUser(user.id)}
                aria-label={`Deactivate ${user.firstName} ${user.lastName}`}
              >
                <Block />
                Deactivate
              </Button>
            ) : (
              <Button
                variant="success"
                size="small"
                onClick={() => handleReactivateUser(user.id)}
                aria-label={`Reactivate ${user.firstName} ${user.lastName}`}
              >
                <CheckCircle />
                Reactivate
              </Button>
            )}
          </>
        )}
      </ActionsContainer>
    );
  };

  // LD1: Define data table columns with appropriate renderers
  const columns: ColumnDefinition<User>[] = [
    { field: 'firstName', header: 'First Name' },
    { field: 'lastName', header: 'Last Name' },
    { field: 'email', header: 'Email' },
    { field: 'userType', header: 'User Type', renderCell: renderUserTypeCell },
    { field: 'status', header: 'Status', renderCell: renderStatusCell },
    { field: 'createdAt', header: 'Created At' },
    { field: 'updatedAt', header: 'Updated At' },
    { field: 'id', header: 'Actions', renderCell: renderActionsCell },
  ];

  // LD1: Fetch users on component mount and when filters or pagination changes
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // LD1: Handlers for opening and closing modals
  const openInviteUserModal = () => setInviteUserModalOpen(true);
  const closeInviteUserModal = () => setInviteUserModalOpen(false);
  const closeEditRoleModal = () => setEditRoleModalOpen(false);

  return (
    <Container>
      {/* LD1: Render alerts for success and error messages */}
      <AlertContainer>
        <Alert
          severity={alert.type}
          message={alert.message}
          onClose={() => setAlert((prev) => ({ ...prev, visible: false }))}
          className={alert.visible ? '' : 'hidden'}
        />
      </AlertContainer>

      {/* LD1: Render the component with header, action buttons, filters, and data table */}
      <Header>
        <Title>User Management</Title>
        <ActionButtons>
          <Button variant="primary" onClick={openInviteUserModal}>
            <Add />
            Invite User
          </Button>
        </ActionButtons>
      </Header>

      <FilterContainer>
        <FilterItem>
          <Input
            type="text"
            name="search"
            placeholder="Search users"
            value={filters.search}
            onChange={handleFilterChange}
          />
        </FilterItem>
        <FilterItem>
          <Select
            name="userType"
            options={USER_TYPE_OPTIONS}
            value={filters.userType}
            onChange={handleFilterChange}
            placeholder="Select User Type"
          />
        </FilterItem>
        <FilterItem>
          <Select
            name="status"
            options={STATUS_OPTIONS}
            value={filters.status}
            onChange={handleFilterChange}
            placeholder="Select Status"
          />
        </FilterItem>
      </FilterContainer>

      <DataTable<User>
        data={users}
        columns={columns}
        loading={loading}
        pagination={{
          enabled: true,
          page: pagination.page,
          limit: pagination.limit,
          totalItems: pagination.total,
          onPageChange: handlePageChange,
        }}
      />

      {/* LD1: Render modals for user invitation and role management */}
      <Modal
        isOpen={inviteUserModalOpen}
        onClose={closeInviteUserModal}
        title="Invite New User"
      >
        <form onSubmit={handleInviteUser}>
          <FormGroup>
            <Input
              type="email"
              name="email"
              label="Email"
              value={inviteFormData.email}
              onChange={(e) =>
                setInviteFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              required
            />
          </FormGroup>
          <FormGroup>
            <Input
              type="text"
              name="firstName"
              label="First Name"
              value={inviteFormData.firstName}
              onChange={(e) =>
                setInviteFormData((prev) => ({ ...prev, firstName: e.target.value }))
              }
              required
            />
          </FormGroup>
          <FormGroup>
            <Input
              type="text"
              name="lastName"
              label="Last Name"
              value={inviteFormData.lastName}
              onChange={(e) =>
                setInviteFormData((prev) => ({ ...prev, lastName: e.target.value }))
              }
              required
            />
          </FormGroup>
          <FormGroup>
            <Select
              name="roleId"
              label="Role"
              options={ROLE_OPTIONS}
              value={inviteFormData.roleId}
              onChange={(e) =>
                setInviteFormData((prev) => ({ ...prev, roleId: e.target.value }))
              }
              required
            />
          </FormGroup>
          <ModalActions>
            <Button variant="secondary" onClick={closeInviteUserModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Invite
            </Button>
          </ModalActions>
        </form>
      </Modal>

      <Modal
        isOpen={editRoleModalOpen}
        onClose={closeEditRoleModal}
        title={`Edit Role for ${selectedUser?.firstName} ${selectedUser?.lastName}`}
      >
        <form onSubmit={handleUpdateRole}>
          <FormGroup>
            <Select
              name="roleId"
              label="Role"
              options={ROLE_OPTIONS}
              value={inviteFormData.roleId}
              onChange={(e) =>
                setInviteFormData((prev) => ({ ...prev, roleId: e.target.value }))
              }
              required
            />
          </FormGroup>
          <ModalActions>
            <Button variant="secondary" onClick={closeEditRoleModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Update Role
            </Button>
          </ModalActions>
        </form>
      </Modal>
    </Container>
  );
};

export default UserManagement;