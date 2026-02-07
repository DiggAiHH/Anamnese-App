import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DocumentType } from '../domain/entities/DocumentRequest';

export type PatientStatus = 'new' | 'returning' | null;
export type VisitReason = 'termin' | 'recipe' | 'au' | 'referral' | 'documents' | null;
export type InsuranceType = 'private' | 'public' | null;
export type SelectedConcern = DocumentType | null;

interface PatientState {
    patientStatus: PatientStatus;
    visitReason: VisitReason;
    insuranceType: InsuranceType;
    insuranceNumber: string;
    birthDate: {
        day: string;
        month: string;
        year: string;
    };
    userRole: 'doctor' | 'patient' | null;
    /** Selected document concern for existing patients (Rezept, Überweisung, AU) */
    selectedConcern: SelectedConcern;
    /** Whether the patient wants to skip full anamnesis (existing patient quick flow) */
    skipFullAnamnesis: boolean;
}

interface PatientContextType extends PatientState {
    setPatientStatus: (status: PatientStatus) => void;
    setVisitReason: (reason: VisitReason) => void;
    setInsuranceType: (type: InsuranceType) => void;
    setInsuranceNumber: (num: string) => void;
    setBirthDate: (date: { day: string; month: string; year: string }) => void;
    setUserRole: (role: 'doctor' | 'patient' | null) => void;
    setSelectedConcern: (concern: SelectedConcern) => void;
    setSkipFullAnamnesis: (skip: boolean) => void;
    resetPatientData: () => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider = ({ children }: { children: ReactNode }) => {
    const [patientStatus, setPatientStatus] = useState<PatientStatus>(null);
    const [visitReason, setVisitReason] = useState<VisitReason>(null);
    const [insuranceType, setInsuranceType] = useState<InsuranceType>(null);
    const [insuranceNumber, setInsuranceNumber] = useState<string>('');
    const [birthDate, setBirthDate] = useState({ day: '', month: '', year: '' });
    const [userRole, setUserRole] = useState<'doctor' | 'patient' | null>(null);
    const [selectedConcern, setSelectedConcern] = useState<SelectedConcern>(null);
    const [skipFullAnamnesis, setSkipFullAnamnesis] = useState<boolean>(false);

    const resetPatientData = () => {
        setPatientStatus(null);
        setVisitReason(null);
        setInsuranceType(null);
        setInsuranceNumber('');
        setBirthDate({ day: '', month: '', year: '' });
        setUserRole(null);
        setSelectedConcern(null);
        setSkipFullAnamnesis(false);
    };

    return (
        <PatientContext.Provider
            value={{
                patientStatus,
                setPatientStatus,
                visitReason,
                setVisitReason,
                insuranceType,
                setInsuranceType,
                insuranceNumber,
                setInsuranceNumber,
                birthDate,
                setBirthDate,
                userRole,
                setUserRole,
                selectedConcern,
                setSelectedConcern,
                skipFullAnamnesis,
                setSkipFullAnamnesis,
                resetPatientData,
            }}>
            {children}
        </PatientContext.Provider>
    );
};

export const usePatientContext = () => {
    const context = useContext(PatientContext);
    if (!context) {
        throw new Error('usePatientContext must be used within a PatientProvider');
    }
    return context;
};
