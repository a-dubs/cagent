# Tool Call UI Improvements

## Summary

I've completely overhauled the tool call display system in the cagent web UI to address the issues with fragmented tool call displays and missing approval prompts.

## Key Changes

### 1. Enhanced Type System (`web/src/types/index.ts`)
- Added `PendingToolCall` interface for tools awaiting approval/execution
- Added `CompletedToolCall` interface for finished tools
- Extended `Message` interface with `pendingTools` and `completedTools` arrays
- This allows aggregating multiple tool states within a single assistant message

### 2. New ToolCallDisplay Component (`web/src/components/ToolCallDisplay.tsx`)
- **Organized Layout**: Tool calls are now displayed in collapsible, nested cards
- **Status Indicators**: Clear visual status icons (pending, approved, executing, completed)
- **Approval Controls**: Inline approve/reject/approve-all buttons for pending tools
- **Collapsible Sections**: Arguments, thinking, and output are collapsible by default
- **Better Typography**: Consistent spacing and typography throughout

### 3. Improved Message Handling (`web/src/App.tsx`)
- **Tool Aggregation**: Instead of creating separate messages for each tool event, tools are now aggregated into the assistant message that triggered them
- **State Management**: Tools transition from pending → approved → completed within the same message
- **Smart Updates**: Tool state updates are handled efficiently without creating new messages

### 4. Enhanced ChatInterface (`web/src/components/ChatInterface.tsx`)
- **Integrated Display**: ToolCallDisplay component is now embedded within assistant messages
- **Callback Handling**: Added `onToolApprove` callback for handling tool approvals
- **Consistent Styling**: Tool calls now appear as part of the assistant's response rather than separate entities

## Problem Solutions

### ✅ Fixed: Tool Call Fragmentation
- **Before**: Each tool event (confirmation, call, response) created separate message bubbles
- **After**: All tool activity for a response is grouped under a single assistant message

### ✅ Fixed: Missing Approval Prompts
- **Before**: Tool approval UI existed but wasn't properly triggered
- **After**: Clear approval buttons appear for each pending tool with options for single or session-wide approval

### ✅ Fixed: Poor Organization
- **Before**: Tool information was scattered and hard to follow
- **After**: Clean, collapsible interface similar to Cursor's tool call display

## UI Features

### Tool Status Visualization
- 🟡 **Pending Approval**: Yellow alert icon with approval buttons
- 🔵 **Approved**: Blue play icon 
- 🔵 **Executing**: Blue spinning loader
- 🟢 **Completed**: Green checkmark with duration

### Collapsible Sections
- Tool arguments (collapsed by default)
- Thinking output (for think tools, collapsed by default)
- Tool output (collapsed by default)
- Duration display for completed tools

### Approval Controls
- **Approve**: Allow this specific tool
- **Approve All**: Allow this and all future tools in the session  
- **Reject**: Deny this tool execution

## Technical Implementation

The system now works by:

1. **Tool Confirmation Events** → Add to `pendingTools` array on latest assistant message
2. **Tool Execution Events** → Move tool from `pendingTools` to `completedTools` with output
3. **Render Logic** → ToolCallDisplay component renders both arrays in organized UI
4. **User Interaction** → Approval callbacks update tool status and notify backend

This creates a much more coherent and user-friendly tool call experience that matches modern AI assistant interfaces.
