import { GDTExportVO, GDTFieldIds, GDTRecordBuilder } from '@domain/value-objects/GDTExport';

const PATIENT_ID = '11111111-1111-1111-1111-111111111111';

describe('GDTExportVO', () => {
  it('creates export with checksum and metadata', () => {
    const records = [
      { length: 13, fieldId: '8000', data: 'Test' },
      { length: 14, fieldId: GDTFieldIds.VERSION, data: '2.1' },
    ];

    const exportVO = GDTExportVO.create({
      version: '2.1',
      senderId: 'ANAM',
      receiverId: 'PVS1',
      patientId: PATIENT_ID,
      records,
    });

    expect(exportVO.version).toBe('2.1');
    expect(exportVO.senderId).toBe('ANAM');
    expect(exportVO.receiverId).toBe('PVS1');
    expect(exportVO.exportedAt).toBeInstanceOf(Date);
    expect(exportVO.validateChecksum()).toBe(true);
  });

  it('serializes to GDT string with padded length', () => {
    const builder = new GDTRecordBuilder().addRecord(GDTFieldIds.RECORD_TYPE, 'ANAMNESE');
    const exportVO = builder.build({
      version: '2.1',
      senderId: 'ANAM',
      patientId: PATIENT_ID,
    });

    const gdtString = exportVO.toGDTString();
    const lines = gdtString.split('\r\n').filter(Boolean);

    expect(lines.length).toBeGreaterThan(0);
    const firstLine = lines[0];
    const lengthField = parseInt(firstLine.substring(0, 3), 10);
    const fieldStrLength = firstLine.length - 3; // payload without CRLF
    expect(lengthField).toBe(3 + fieldStrLength + 2); // encoder includes length digits + CRLF
    expect(firstLine).toContain(GDTFieldIds.RECORD_TYPE);
  });

  it('parses from GDT string and preserves checksum', () => {
    const builder = new GDTRecordBuilder()
      .addRecord(GDTFieldIds.RECORD_TYPE, 'ANAMNESE')
      .addRecord(GDTFieldIds.VERSION, '2.1');

    const exportVO = builder.build({
      version: '2.1',
      senderId: 'ANAM',
      patientId: PATIENT_ID,
    });

    const gdtString = exportVO.toGDTString();
    const parsed = GDTExportVO.fromGDTString(gdtString, PATIENT_ID, 'ANAM');

    expect(parsed.records.length).toBe(exportVO.records.length);
    expect(parsed.patientId).toBe(PATIENT_ID);
    expect(parsed.validateChecksum()).toBe(true);
  });
});

