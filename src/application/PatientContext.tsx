import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DocumentType, type IDocumentRequest } from '../domain/entities/DocumentRequest';
import { type UserRoleOrNull, isValidUserRole } from '../domain/entities/UserRole';
import { logError } from '../shared/logger';

const ROLE_STORAGE_KEY = '@anamnese_user_role';

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
    userRole: UserRoleOrNull;
    /** Selected document concern for existing patients (Rezept, Überweisung, AU) */
    selectedConcern: SelectedConcern;
    /** Whether the patient wants to skip full anamnesis (existing patient quick flow) */
    skipFullAnamnesis: boolean;
    /** Pending document request to be submitted after anamnesis completes (for new patients) */
    pendingDocumentRequest: IDocumentRequest | null;
}

interface PatientContextType extends PatientState {
    setPatientStatus: (status: PatientStatus) => void;
    setVisitReason: (reason: VisitReason) => void;
    setInsuranceType: (type: InsuranceType) => void;
    setInsuranceNumber: (num: string) => void;
    setBirthDate: (date: { day: string; month: string; year: string }) => void;
    setUserRole: (role: UserRoleOrNull) => void;
    setSelectedConcern: (concern: SelectedConcern) => void;
    setSkipFullAnamnesis: (skip: boolean) => void;
    setPendingDocumentRequest: (request: IDocumentRequest | null) => void;
    resetPatientData: () => void;
    /** Whether the role has been loaded from storage (prevents flash) */
    roleLoaded: boolean;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider = ({ children }: { children: ReactNode }) => {
    const [patientStatus, setPatientStatus] = useState<PatientStatus>(null);
    const [visitReason, setVisitReason] = useState<VisitReason>(null);
    const [insuranceType, setInsuranceType] = useState<InsuranceType>(null);
    const [insuranceNumber, setInsuranceNumber] = useState<string>('');
    const [birthDate, setBirthDate] = useState({ day: '', month: '', year: '' });
    const [userRole, setUserRoleState] = useState<UserRoleOrNull>(null);
    const [roleLoaded, setRoleLoaded] = useState(false);
    const [selectedConcern, setSelectedConcern] = useState<SelectedConcern>(null);
    const [skipFullAnamnesis, setSkipFullAnamnesis] = useState<boolean>(false);
    const [pendingDocumentRequest, setPendingDocumentRequest] = useState<IDocumentRequest | null>(null);

    // Load persisted role on mount
    useEffect(() => {
        const loadRole = async () => {
            try {
                const stored = await AsyncStorage.getItem(ROLE_STORAGE_KEY);
                if (stored && isValidUserRole(stored)) {
                    setUserRoleState(stored);
                }
            } catch (_err) {
                logError('[PatientContext] Failed to load persisted role');
            } finally {
                setRoleLoaded(true);
            }
        };
        loadRole();
    }, []);

    // Persist role to AsyncStorage on change
    const setUserRole = useCallback((role: UserRoleOrNull) => {
        setUserRoleState(role);
        AsyncStorage.setItem(ROLE_STORAGE_KEY, role ?? '').catch((_err) => {
            logError('[PatientContext] Failed to persist role');
        });
    }, []);

    const resetPatientData = useCallback(() => {
        setPatientStatus(null);
        setVisitReason(null);
        setInsuranceType(null);
        setInsuranceNumber('');
        setBirthDate({ day: '', month: '', year: '' });
        // Note: userRole is NOT reset here — it persists across sessions.
        // To clear role, call setUserRole(null) explicitly.
        setSelectedConcern(null);
        setSkipFullAnamnesis(false);
        setPendingDocumentRequest(null);
    }, []);

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
                pendingDocumentRequest,
                setPendingDocumentRequest,
                resetPatientData,
                roleLoaded,
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
