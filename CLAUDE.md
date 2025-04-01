# SmartSolver - Claude Instructions

## Project Overview
SmartSolver is a web application that helps users analyze and solve problems using both structured frameworks and AI-generated solutions.

## Development Commands
- **Run locally**: Open `index.html` in a browser
- **Validate HTML**: `npx html-validator --file=index.html --verbose`
- **Validate CSS**: `npx stylelint "style.css"`
- **Format code**: `npx prettier --write "*.{html,css,js}"`

## Code Style Guidelines

### HTML
- Use HTML5 semantic elements
- Maintain indentation of 4 spaces
- Use double quotes for attributes
- Include appropriate ARIA attributes for accessibility

### CSS
- Follow existing class naming conventions (using utility classes)
- Use Tailwind CSS utilities where possible
- Custom styles should follow BEM naming conventions when needed
- Keep animations and transitions consistent

### JavaScript
- Use ES6+ features with appropriate browser support
- Follow camelCase for variable and function names
- Use descriptive variable names
- Handle errors gracefully with appropriate user feedback
- Comment complex logic or calculations

### Git Workflow
- Write clear commit messages describing changes
- Group related changes in single commits
- Test all functionality before committing