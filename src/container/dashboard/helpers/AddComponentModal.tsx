'use client';

import {
    AwesomeModal,
    getGlobalStyle,
    Icon,
    RippleButton,
    Text,
} from 'pkg-components';
import React, { FunctionComponent } from 'react';

import styles from './AddComponentModal.module.css';

const SUCCESS_GREEN = '#22c55e';
const ERROR_RED = '#ef4444';

interface AddComponentModalProps {
    show: boolean;
    onHide: () => void;
    componentMap: Record<string, React.ComponentType<Record<string, unknown>>>;
    /** Keys of the components currently present on the dashboard. */
    activeKeys: string[];
    onAdd: (key: string) => void;
    onRemove: (key: string) => void;
}

/**
 * Modal that shows a gallery of the dashboard components available to add.
 * Each card renders a scaled-down live preview of the real component.
 * Components already present on the dashboard are flagged with a green check
 * and offer a "Eliminar" action.
 */
export const AddComponentModal: FunctionComponent<AddComponentModalProps> = ({
    show,
    onHide,
    componentMap,
    activeKeys,
    onAdd,
    onRemove,
}) => {
    // Only the base catalog keys (PascalCase), not the per-instance aliases.
    const catalogKeys = Object.keys(componentMap).filter(
        (key) => /^[A-Z]/.test(key) && !key.startsWith('comp_')
    );

    const activeKeySet = new Set(activeKeys.filter(Boolean));

    return (
        <AwesomeModal
            show={show}
            onHide={onHide}
            onCancel={onHide}
            title='Agregar componente al dashboard'
            size='large'
            header
            footer={false}
            btnConfirm={false}
            useScroll
        >
            <div className={styles.container}>
                <div className={styles.grid}>
                    {catalogKeys.map((key) => {
                        const PreviewComponent = componentMap[key];
                        const isActive = activeKeySet.has(key);

                        return (
                            <div
                                key={key}
                                className={`${styles.card} ${
                                    isActive ? styles.cardActive : ''
                                }`}
                            >
                                <div className={styles.previewHeader}>
                                    <Text as='h4' size='sm'>
                                        {key}
                                    </Text>

                                    {isActive && (
                                        <span className={styles.activeBadge}>
                                            <Icon
                                                icon='IconMiniCheck'
                                                color={SUCCESS_GREEN}
                                                size={18}
                                            />

                                            <Text
                                                size='xs'
                                                color={SUCCESS_GREEN}
                                            >
                                                En el dashboard
                                            </Text>
                                        </span>
                                    )}
                                </div>

                                <div className={styles.previewViewport}>
                                    <div className={styles.previewScale}>
                                        {PreviewComponent ? (
                                            <PreviewComponent />
                                        ) : null}
                                    </div>
                                </div>

                                {isActive ? (
                                    <RippleButton
                                        onClick={() => onRemove(key)}
                                        radius='0.5rem'
                                        bgColor={getGlobalStyle(
                                            '--color-base-white'
                                        )}
                                        color={ERROR_RED}
                                        border={`1px solid ${ERROR_RED}`}
                                        style={{ width: '100%' }}
                                    >
                                        Eliminar
                                    </RippleButton>
                                ) : (
                                    <RippleButton
                                        onClick={() => onAdd(key)}
                                        radius='0.5rem'
                                        style={{ width: '100%' }}
                                    >
                                        Agregar
                                    </RippleButton>
                                )}
                            </div>
                        );
                    })}

                    {catalogKeys.length === 0 && (
                        <div className={styles.emptyState}>
                            <Text align='center'>
                                No hay componentes disponibles para agregar.
                            </Text>
                        </div>
                    )}
                </div>
            </div>
        </AwesomeModal>
    );
};