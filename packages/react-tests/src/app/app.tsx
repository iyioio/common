// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getParam, initRootScope, STATIC_ENV_VARS, __macro__ } from '@iyio/common';


initRootScope(reg=>reg.provideParams(__macro__(STATIC_ENV_VARS)));

export function App() {
    return (
        <>
            <h1 className="test-A">{getParam('NX_TEST_A','EMPTY')}</h1>
            <h1 className="test-B">{getParam('NX_TEST_B','EMPTY')}</h1>
            <h1 className="test-C">{getParam('NX_TEST_C','EMPTY')}</h1>
            <h1 className="test-D">{getParam('NX_TEST_D','EMPTY')}</h1>
        </>
    );
}

export default App;
