
describe('react-tests', () => {
    beforeEach(() => cy.visit('/'));

    it('should display NX_ hardcoded env var',()=>{
        cy.get('.test-A').contains('a');
        cy.get('.test-B').contains('b');
    })

    it('should not display non NX_ hardcoded env var',()=>{
        cy.get('.test-C').contains('EMPTY');
        cy.get('.test-D').contains('EMPTY');
    })
});
