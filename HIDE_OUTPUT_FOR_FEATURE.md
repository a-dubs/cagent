# Hide Output For Feature Implementation

## Overview

This feature adds a `--hide-output-for` flag to both `cagent run` and `cagent exec` commands, allowing users to hide verbose tool output while still seeing tool calls. This is particularly useful for automation, scripting, and cleaner log output.

## Motivation

When running agents in automation or when monitoring agent behavior, the full tool output (especially from file operations and shell commands) can be extremely verbose and clutters the interface. Users want to see:
- ✅ What tools are being called
- ✅ Agent reasoning and responses  
- ❌ Verbose tool output (file contents, command output, etc.)

## Implementation

### Files Modified

1. **`cmd/root/run.go`**
   - Added `hideOutputFor` variable
   - Added `--hide-output-for` flag to `NewRunCmd()`
   - Updated `printToolCallResponse()` call to pass the flag value

2. **`cmd/root/exec.go`**
   - Added `--hide-output-for` flag to `NewExecCmd()`

3. **`cmd/root/run_text_utils.go`**
   - Added `shouldHideOutput()` function for checking if output should be hidden
   - Added `isFileOperation()` function for categorizing file operations
   - Modified `printToolCallResponse()` to conditionally hide output
   - Updated with complete list of filesystem tools from builtin toolset

### Flag Usage

```bash
--hide-output-for=<comma-separated-list>
```

**Available options (validated enum):**

**Categories:**
- `all` - Hide output from all tools
- `file-ops` - Hide output from all filesystem tools
- `shell` - Hide output from shell tool
- `think` - Hide output from think tool
- `memory` - Hide output from all memory tools
- `todo` - Hide output from all todo tools
- `transfer` - Hide output from transfer_task tool

**Individual filesystem tools:**
- `create_directory`, `directory_tree`, `edit_file`, `get_file_info`
- `list_allowed_directories`, `add_allowed_directory`, `list_directory`
- `list_directory_with_sizes`, `move_file`, `read_file`, `read_multiple_files`
- `search_files`, `search_files_content`, `write_file`

**Individual todo tools:**
- `create_todo`, `create_todos`, `update_todo`, `list_todos`

**Individual memory tools:**
- `add_memory`, `get_memories`, `delete_memory`

**Individual transfer tool:**
- `transfer_task`

**Validation:** All options are validated - invalid options will show an error with all valid choices.

### Examples

```bash
# Hide output from all file operations
cagent run agent.yaml --hide-output-for=file-ops

# Hide output from shell commands
cagent run agent.yaml --hide-output-for=shell

# Hide output from specific tools
cagent run agent.yaml --hide-output-for=read_file,write_file

# Hide output from all tools
cagent run agent.yaml --hide-output-for=all

# Combine with automation flags
cagent run agent.yaml "message" --tui=false --yolo --hide-output-for=file-ops,shell
```

### Behavior

**Without flag:**
```
read_file(path: "config.json")

read_file response → (
{
  "setting1": "value1",
  "setting2": "value2",
  ...
}
)
```

**With `--hide-output-for=read_file`:**
```
read_file(path: "config.json")

read_file response → (output hidden)
```

## File Operations Covered

The `file-ops` category includes all built-in filesystem tools:
- `create_directory`
- `directory_tree`
- `edit_file`
- `get_file_info`
- `list_allowed_directories`
- `add_allowed_directory`
- `list_directory`
- `list_directory_with_sizes`
- `move_file`
- `read_file`
- `read_multiple_files`
- `search_files`
- `search_files_content`
- `write_file`

## Edge Cases Handled

1. **Empty string**: `--hide-output-for=""` - Shows full output (no hiding)
2. **Invalid tool names**: Now validated with clear error messages showing all valid options
3. **Spaces in list**: `--hide-output-for=" read_file , write_file "` - Properly trimmed
4. **Case sensitivity**: Exact string matching (consistent with tool names)
5. **Enum validation**: Only valid options accepted, with helpful error messages for invalid ones

## Testing

Comprehensive testing performed:
- ✅ Normal operation without flag
- ✅ Individual tool hiding
- ✅ Category-based hiding (`file-ops`, `all`, `memory`, `todo`, etc.)
- ✅ Multiple tool combinations
- ✅ Edge cases (empty strings, invalid names, spaces)
- ✅ Validation with invalid options (proper error messages)
- ✅ All builtin tools covered (filesystem, shell, think, memory, todo, transfer)
- ✅ Both `run` and `exec` commands
- ✅ Integration with other flags (`--tui=false`, `--yolo`)
- ✅ Help text shows all available options

## Documentation Updates

Updated documentation in:
- `docs/USAGE.md` - Added Output Control section with examples
- Help text for both `run` and `exec` commands

## Backward Compatibility

This feature is fully backward compatible:
- Default behavior unchanged (no flag = full output)
- No breaking changes to existing functionality
- Optional flag that doesn't affect existing workflows

## Code Quality

- ✅ No linting errors
- ✅ Follows existing code patterns and style
- ✅ Proper error handling
- ✅ Clean, readable implementation
- ✅ Comprehensive edge case handling
- ✅ Consistent with existing CLI flag patterns

## Use Cases

1. **Automation/CI**: Clean logs without verbose tool output
2. **Development**: See tool calls without cluttered output
3. **Monitoring**: Track agent behavior without noise
4. **Scripting**: Programmatic agent execution with minimal output
5. **Debugging**: Focus on agent logic rather than tool details

This implementation provides a clean, intuitive way to control output verbosity while maintaining full functionality and backward compatibility.
