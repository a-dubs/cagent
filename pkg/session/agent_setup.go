package session

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"
)

// AgentSetup represents a configured agent setup
type AgentSetup struct {
	ID                   int               `json:"id"`
	Name                 string            `json:"name"`
	Description          string            `json:"description"`
	AgentConfigPath      string            `json:"agent_config_path"`
	WorkingDirectory     string            `json:"working_directory"`
	EnvironmentVariables map[string]string `json:"environment_variables"`
	CreatedAt            time.Time         `json:"created_at"`
	UpdatedAt            time.Time         `json:"updated_at"`
}

// CustomAgentPath represents a user-imported agent configuration path
type CustomAgentPath struct {
	ID          int       `json:"id"`
	Path        string    `json:"path"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	AddedAt     time.Time `json:"added_at"`
}

// AgentSetupStore defines operations for managing agent setups and custom paths
type AgentSetupStore interface {
	// Agent Setups
	CreateAgentSetup(ctx context.Context, setup *AgentSetup) (*AgentSetup, error)
	GetAgentSetup(ctx context.Context, id int) (*AgentSetup, error)
	GetAgentSetups(ctx context.Context) ([]*AgentSetup, error)
	UpdateAgentSetup(ctx context.Context, setup *AgentSetup) error
	DeleteAgentSetup(ctx context.Context, id int) error

	// Custom Agent Paths
	AddCustomAgentPath(ctx context.Context, path *CustomAgentPath) (*CustomAgentPath, error)
	GetCustomAgentPaths(ctx context.Context) ([]*CustomAgentPath, error)
	DeleteCustomAgentPath(ctx context.Context, id int) error
}

// SQLiteAgentSetupStore implements AgentSetupStore using SQLite
type SQLiteAgentSetupStore struct {
	db *sql.DB
}

// NewSQLiteAgentSetupStore creates a new SQLite-based agent setup store
func NewSQLiteAgentSetupStore(db *sql.DB) *SQLiteAgentSetupStore {
	return &SQLiteAgentSetupStore{db: db}
}

// CreateAgentSetup creates a new agent setup
func (s *SQLiteAgentSetupStore) CreateAgentSetup(ctx context.Context, setup *AgentSetup) (*AgentSetup, error) {
	envVarsJSON, err := json.Marshal(setup.EnvironmentVariables)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal environment variables: %w", err)
	}

	now := time.Now()
	setup.CreatedAt = now
	setup.UpdatedAt = now

	result, err := s.db.ExecContext(ctx, `
		INSERT INTO agent_setups (name, description, agent_config_path, working_directory, environment_variables, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
		setup.Name, setup.Description, setup.AgentConfigPath, setup.WorkingDirectory,
		string(envVarsJSON), now.Format(time.RFC3339), now.Format(time.RFC3339))
	if err != nil {
		return nil, fmt.Errorf("failed to create agent setup: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("failed to get last insert ID: %w", err)
	}

	setup.ID = int(id)
	return setup, nil
}

// GetAgentSetup retrieves an agent setup by ID
func (s *SQLiteAgentSetupStore) GetAgentSetup(ctx context.Context, id int) (*AgentSetup, error) {
	var setup AgentSetup
	var envVarsJSON string
	var createdAtStr, updatedAtStr string

	err := s.db.QueryRowContext(ctx, `
		SELECT id, name, description, agent_config_path, working_directory, environment_variables, created_at, updated_at
		FROM agent_setups WHERE id = ?`, id).Scan(
		&setup.ID, &setup.Name, &setup.Description, &setup.AgentConfigPath,
		&setup.WorkingDirectory, &envVarsJSON, &createdAtStr, &updatedAtStr)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("agent setup not found")
		}
		return nil, fmt.Errorf("failed to get agent setup: %w", err)
	}

	err = json.Unmarshal([]byte(envVarsJSON), &setup.EnvironmentVariables)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal environment variables: %w", err)
	}

	setup.CreatedAt, err = time.Parse(time.RFC3339, createdAtStr)
	if err != nil {
		return nil, fmt.Errorf("failed to parse created_at: %w", err)
	}

	setup.UpdatedAt, err = time.Parse(time.RFC3339, updatedAtStr)
	if err != nil {
		return nil, fmt.Errorf("failed to parse updated_at: %w", err)
	}

	return &setup, nil
}

// GetAgentSetups retrieves all agent setups
func (s *SQLiteAgentSetupStore) GetAgentSetups(ctx context.Context) ([]*AgentSetup, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, name, description, agent_config_path, working_directory, environment_variables, created_at, updated_at
		FROM agent_setups ORDER BY created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("failed to query agent setups: %w", err)
	}
	defer rows.Close()

	var setups []*AgentSetup
	for rows.Next() {
		var setup AgentSetup
		var envVarsJSON string
		var createdAtStr, updatedAtStr string

		err := rows.Scan(&setup.ID, &setup.Name, &setup.Description, &setup.AgentConfigPath,
			&setup.WorkingDirectory, &envVarsJSON, &createdAtStr, &updatedAtStr)
		if err != nil {
			return nil, fmt.Errorf("failed to scan agent setup: %w", err)
		}

		err = json.Unmarshal([]byte(envVarsJSON), &setup.EnvironmentVariables)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal environment variables: %w", err)
		}

		setup.CreatedAt, err = time.Parse(time.RFC3339, createdAtStr)
		if err != nil {
			return nil, fmt.Errorf("failed to parse created_at: %w", err)
		}

		setup.UpdatedAt, err = time.Parse(time.RFC3339, updatedAtStr)
		if err != nil {
			return nil, fmt.Errorf("failed to parse updated_at: %w", err)
		}

		setups = append(setups, &setup)
	}

	return setups, nil
}

// UpdateAgentSetup updates an existing agent setup
func (s *SQLiteAgentSetupStore) UpdateAgentSetup(ctx context.Context, setup *AgentSetup) error {
	envVarsJSON, err := json.Marshal(setup.EnvironmentVariables)
	if err != nil {
		return fmt.Errorf("failed to marshal environment variables: %w", err)
	}

	setup.UpdatedAt = time.Now()

	_, err = s.db.ExecContext(ctx, `
		UPDATE agent_setups 
		SET name = ?, description = ?, agent_config_path = ?, working_directory = ?, 
		    environment_variables = ?, updated_at = ?
		WHERE id = ?`,
		setup.Name, setup.Description, setup.AgentConfigPath, setup.WorkingDirectory,
		string(envVarsJSON), setup.UpdatedAt.Format(time.RFC3339), setup.ID)
	if err != nil {
		return fmt.Errorf("failed to update agent setup: %w", err)
	}

	return nil
}

// DeleteAgentSetup deletes an agent setup
func (s *SQLiteAgentSetupStore) DeleteAgentSetup(ctx context.Context, id int) error {
	_, err := s.db.ExecContext(ctx, "DELETE FROM agent_setups WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("failed to delete agent setup: %w", err)
	}
	return nil
}

// AddCustomAgentPath adds a new custom agent path
func (s *SQLiteAgentSetupStore) AddCustomAgentPath(ctx context.Context, path *CustomAgentPath) (*CustomAgentPath, error) {
	now := time.Now()
	path.AddedAt = now

	result, err := s.db.ExecContext(ctx, `
		INSERT INTO custom_agent_paths (path, name, description, added_at)
		VALUES (?, ?, ?, ?)`,
		path.Path, path.Name, path.Description, now.Format(time.RFC3339))
	if err != nil {
		return nil, fmt.Errorf("failed to add custom agent path: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("failed to get last insert ID: %w", err)
	}

	path.ID = int(id)
	return path, nil
}

// GetCustomAgentPaths retrieves all custom agent paths
func (s *SQLiteAgentSetupStore) GetCustomAgentPaths(ctx context.Context) ([]*CustomAgentPath, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, path, name, description, added_at
		FROM custom_agent_paths ORDER BY added_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("failed to query custom agent paths: %w", err)
	}
	defer rows.Close()

	var paths []*CustomAgentPath
	for rows.Next() {
		var path CustomAgentPath
		var addedAtStr string

		err := rows.Scan(&path.ID, &path.Path, &path.Name, &path.Description, &addedAtStr)
		if err != nil {
			return nil, fmt.Errorf("failed to scan custom agent path: %w", err)
		}

		path.AddedAt, err = time.Parse(time.RFC3339, addedAtStr)
		if err != nil {
			return nil, fmt.Errorf("failed to parse added_at: %w", err)
		}

		paths = append(paths, &path)
	}

	return paths, nil
}

// DeleteCustomAgentPath deletes a custom agent path
func (s *SQLiteAgentSetupStore) DeleteCustomAgentPath(ctx context.Context, id int) error {
	_, err := s.db.ExecContext(ctx, "DELETE FROM custom_agent_paths WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("failed to delete custom agent path: %w", err)
	}
	return nil
}
