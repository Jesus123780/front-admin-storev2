'use client'

import {
  Button,
  Checkbox,
  getGlobalStyle,
  Icon,
  Tag
} from 'pkg-components'
import React from 'react'

import styles from './Optional.module.css'

type OptionalId = string | number

type OptionalSubItem = {
  opSubExPid: OptionalId
  OptionalSubProName?: string | null
  check?: unknown
}

type OptionalGroup = {
  opExPid: OptionalId
  OptionalProName?: string | null
  numbersOptionalOnly?: number | string | null
  required?: boolean | null
  code?: string | number | null
  ExtProductFoodsSubOptionalAll?: OptionalSubItem[] | null
}

type HandleAddOptionalParams = {
  exOptional: any
  codeCategory?: any
  index: number
}

type OptionalProps = {
  editing?: boolean
  loading?: boolean
  dataOptional?: OptionalGroup[] | null
  handleLineChange?: (
    index: number,
    field: 'exState',
    value: boolean
  ) => void
  handlersPropsOptional?: {
    handleAddOptional?: (params: HandleAddOptionalParams) => unknown
  } | null
  handleDeleteItemSubOptional?: (item: any) => void
}

export const Optional = ({
  editing,
  loading = false,
  dataOptional = [],
  handleLineChange = () => undefined,
  handlersPropsOptional = {
    handleAddOptional: ({ exOptional, codeCategory, index }) => {
      return {
        exOptional,
        codeCategory,
        index
      }
    }
  },
  handleDeleteItemSubOptional = () => undefined
}: OptionalProps) => {
  const componentId = React.useId()
  const handleAddOptional = handlersPropsOptional?.handleAddOptional

  return (
    <div className={styles.optionalContainer}>
      {dataOptional?.length > 0 && dataOptional.map((x, i) => {
        const groupTitleId = `${componentId}-group-title-${i}`

        return (
          <section
            key={x.opExPid}
            className={styles.optionalGroup}
            aria-labelledby={groupTitleId}
            aria-busy={loading}
          >
            <div className={styles.optionalGroupHeader}>
              <div className={styles.optionalGroupTitleWrapper}>
                <h3 id={groupTitleId} className={styles.optionalGroupTitle}>
                  {x.OptionalProName}
                </h3>

                {!!x.numbersOptionalOnly && (
                  <p className={styles.optionalGroupTitleDesc}>
                    Escoge hasta {x.numbersOptionalOnly} opciones.
                  </p>
                )}
              </div>

              <div className={styles.optionalGroupMeta}>
                <div className={styles.optionalGroupBadge}>
                  <Icon
                    icon='IconMiniCheck'
                    color={getGlobalStyle('--color-icons-success')}
                    size={15}
                  />
                  {Boolean(x.required) && <Tag label='OBLIGATORIO' />}
                </div>

                {loading && (
                  <span className={styles.optionalLoading} role='status'>
                    Cargando…
                  </span>
                )}
              </div>
            </div>

            {x.ExtProductFoodsSubOptionalAll?.map((z, index) => {
              const optionName = z.OptionalSubProName || 'opción'

              return (
                <div key={z.opSubExPid} className={styles.optionalOption}>
                  <div className={styles.optionalOptionInfo}>
                    <h4 className={styles.optionalOptionName}>
                      {z.OptionalSubProName}
                    </h4>
                    <p className={styles.optionalOptionIndex}>
                      Item: {index + 1}
                    </p>
                  </div>

                  {editing ? (
                    <Button
                      onClick={() => handleDeleteItemSubOptional(z)}
                      type='button'
                      aria-label={`Eliminar ${optionName}`}
                      style={{
                        padding: getGlobalStyle('--spacing-xl'),
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <Icon
                        color={getGlobalStyle('--color-icons-primary')}
                        icon='IconDelete'
                        size={25}
                      />
                    </Button>
                  ) : (
                    <Checkbox
                      checked={Boolean(z.check)}
                      id={String(z.opSubExPid)}
                      margin='10px 0'
                      name='opSubExPid'
                      aria-label={`Seleccionar ${optionName}`}
                      onChange={value => {
                        return editing
                          ? handleLineChange(i, 'exState', value)
                          : handleAddOptional?.({
                              exOptional: z.opSubExPid,
                              codeCategory: x.code,
                              index
                            })
                      }}
                      value={z.opSubExPid}
                    />
                  )}
                </div>
              )
            })}
          </section>
        )
      })}
    </div>
  )
}
