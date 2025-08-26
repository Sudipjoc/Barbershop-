describe('Barber Dashboard UI Tests', () => {
  const url = 'http://localhost:5000/barberdashboard.html';

  beforeEach(() => {
    cy.visit(url);
  });

  it('should load dashboard and toggle availability', () => {
    cy.get('#availabilityToggle').should('exist');
  });

  it('should load and display service list', () => {
    cy.get('#serviceTableBody').should('exist');
  });

  it('should show employee list', () => {
    cy.get('#employeeTableBody').should('exist');
  });
});
