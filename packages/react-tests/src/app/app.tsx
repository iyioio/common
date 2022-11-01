// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { cf, registerConfig, STATIC_ENV_VARS } from '@iyio/common';


registerConfig(null,STATIC_ENV_VARS);

export function App() {
    return (
        <>
            <h1 className="test-A">{cf().get('NX_TEST_A')||'EMPTY'}</h1>
            <h1 className="test-B">{cf().get('NX_TEST_B')||'EMPTY'}</h1>
            <h1 className="test-C">{cf().get('NX_TEST_C')||'EMPTY'}</h1>
            <h1 className="test-D">{cf().get('NX_TEST_D')||'EMPTY'}</h1>
        </>
    );
}

export default App;
