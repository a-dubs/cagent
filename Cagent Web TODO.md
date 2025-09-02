# Cagent Web TODO

## Chat UI improvements:

- [X] display shell tool calls and outputs with a custom component that emulates the shell experience
- [X] display think tool call as a unqiue component. right now its a standard tool call component that has 3 fields: arguments, thinking, and output. the thinking and output fields are duplicates/redundant. The arguments's "thought" field should be displayed as the like summary of the thinking and then the output should be displayed as the output of the tool call and is collapsed by default.
- [X] BUG: The final response message is now appearing above the shell tool calls, and the thinking tool calls are being displayed below the shell tool calls. within the shell tool calls, the order is correct. 
  - everything should be displayed cronologically and the final response message should be displayed last.
- [ ] improve markdown rendering support
  - [X] make code block rendering actually support language highlighting with automatic dark/light mode support
  - [ ] support for tables
  - [ ] newlines (\n) in the agent's responses are not being rendered/respected in the markdown rendering
- [ ] improve tool calling when a message is provided with it. right now it just displays the message in bubble and then the tool call in a following bubble. it should be displayed in a single bubble to make it more readable and clear.
  ```json
  {
      "content": [
        {
          "text": "Let me run a more targeted approach to check all markdown files at once:",
          "type": "text"
        },
        {
          "id": "toolu_01SJVsnL7Lf6gRjBFJKqsfY2",
          "input": {
            "cmd": "cd ~/git/definitions && find . -name \"*.md\" -type f | xargs pre-commit run trailing-whitespace --files"
          },
          "name": "shell",
          "type": "tool_use"
        }
      ],
      "role": "assistant"
    },
  ```
- [ ] "used tools:" text at bottom of tool call bubble does not appear for live chats only in past chats.
- [ ] agent creation and customization in the UI (instead of having to create yaml files themselves)
  - [ ] having a AI dedicated built-in AI agent to assist with this
- [X] make text size in markdown rendered code blocks smaller (a smidge smaller than the default body text size in chat messages)
  - [X] do the same for shell tool call component
- [ ] EVENTUALLY: overhaul all text to be way more standardized and consistent.
- [X] make most recent/currently active tool call bubble automatically expand to show the full tool call and output and then collapse once it is no longer the most recent/active tool call. for past chats, all tool call bubbles should be collapsed by default.
- [ ] 


