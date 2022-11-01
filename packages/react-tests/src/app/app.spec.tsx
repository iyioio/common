import { render } from '@testing-library/react';

import App from './app';

describe('App', () => {
    it('should render successfully', () => {
        const { baseElement } = render(<App />);

        console.log(baseElement.innerHTML);

        expect(baseElement).toBeTruthy();
    });

    // it('should have a greeting as the title', () => {
    //     const { getByText } = render(<App />);

    //     expect(getByText(/Welcome react-tests/gi)).toBeTruthy();
    // });
});
