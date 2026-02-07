import { Alert } from 'react-native';
import { reportUserError } from '../../src/shared/userFacingError';
import * as logger from '../../src/shared/logger';

describe('reportUserError', () => {
  it('logs error and shows alert', () => {
    const logSpy = jest.spyOn(logger, 'logError').mockImplementation(() => undefined);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

    reportUserError({ title: 'Error', message: 'Something went wrong', error: new Error('boom') });

    expect(logSpy).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('Error', 'Something went wrong');

    logSpy.mockRestore();
    alertSpy.mockRestore();
  });
});
