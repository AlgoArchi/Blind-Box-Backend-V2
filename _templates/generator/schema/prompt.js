module.exports = [
  {
    type: 'input',
    name: 'name',
    message: "What's your schema's name?",
    validate(name) {
      if (!name) {
        return 'The name is required';
      }

      return true;
    },
  },
];
