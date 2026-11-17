'use client'

import { gql, useMutation } from '@apollo/client'
import { useCreateCategoryProduct, usePaginatedCategories } from 'npm-pkg-hook'
import {
 AwesomeModal, getGlobalStyle,Pagination, RippleButton 
} from 'pkg-components'
import React, {
 useCallback, useContext, useEffect, useMemo, useRef, useState 
} from 'react'

import { Context } from '../../context/Context'
import styles from './styles.module.css'

interface Category {
  carProId: string
  pName?: string | null
  ProDescription?: string | null
  pState?: number | null
  createdAt?: string | null
  updatedAt?: string | null
}

interface CategoriesProps {
  /** Legacy prop. Reordering is intentionally disabled for paginated lists. */
  isDragDisabled?: boolean
  /** Wire a real delete mutation outside this component when supported by the backend. */
  onDeleteCategory?: (category: Category) => Promise<void>
}

type StatusFilter = 'all' | 'active' | 'inactive' | 'archived'
type PageOrder = 'server' | 'name-asc' | 'name-desc' | 'oldest'

interface CategoryForm {
  carProId?: string
  catName: string
  catDescription: string
}

const EMPTY_FORM: CategoryForm = { catName: '', catDescription: '' }
const PAGE_SIZES = [10, 20, 50, 100] as const
const CATEGORY_REFETCH_QUERIES = ['CatProductsPaginated', 'catProductsAll']

const EDIT_CATEGORY_PRODUCT = gql`
  mutation EditOneCategoryProduct($pName: String!, $ProDescription: String, $carProId: ID!) {
    editOneCategoryProduct(pName: $pName, ProDescription: $ProDescription, carProId: $carProId) {
      success
      message
    }
  }
`

const stateLabel = (state?: number | null): string => {
  if (state === 1) {return 'Activa'}
  if (state === 0) {return 'Inactiva'}
  if (state === -1) {return 'Archivada'}
  return 'Otro estado'
}

const toTimestamp = (date?: string | null): number => {
  const value = date ? Date.parse(date) : NaN
  return Number.isFinite(value) ? value : 0
}

const formatDate = (date?: string | null): string => {
  const timestamp = toTimestamp(date)
  return timestamp ? new Intl.DateTimeFormat('es-CO', { year: 'numeric', month: 'short', day: '2-digit' }).format(timestamp) : '—'
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Ocurrió un error inesperado.'

/** Client-only sorting; never suggests that the entire database was sorted. */
export const sortVisibleCategories = (items: Category[], order: PageOrder): Category[] => {
  if (order === 'server') {return items}
  const copy = [...items]
  if (order === 'oldest') {return copy.sort((a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt))}
  return copy.sort((a, b) => {
    const comparison = (a.pName ?? '').localeCompare(b.pName ?? '', 'es', { sensitivity: 'base' })
    return order === 'name-asc' ? comparison : -comparison
  })
}

export const Categories: React.FC<CategoriesProps> = ({ isDragDisabled = true, onDeleteCategory }) => {
  const { sendNotification } = useContext(Context)
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [order, setOrder] = useState<PageOrder>('server')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [mutationBusy, setMutationBusy] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchDraft.trim()), 320)
    return () => window.clearTimeout(timer)
  }, [searchDraft])

  const pState = status === 'all' ? undefined : status === 'active' ? 1 : status === 'inactive' ? 0 : -1

  const {
    categories,
    pagination,
    page,
    pageSize,
    loading,
    error,
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    refetch
  } = usePaginatedCategories({ search, pState, pageSize: 20 })

  const { createCategory, loading: creatingCategory } = useCreateCategoryProduct({
    refetchQueryNames: CATEGORY_REFETCH_QUERIES
  })
  const [editCategory, { loading: editingCategory }] = useMutation(EDIT_CATEGORY_PRODUCT)
  const isSaving = mutationBusy || creatingCategory || editingCategory

  const notify = useCallback((title: string, description: string, backgroundColor: 'error' | 'success' | 'warning') => {
    sendNotification({ title, description, backgroundColor })
  }, [sendNotification])

  const totalPages = Number.isSafeInteger(pagination?.totalPages) ? Math.max(0, pagination.totalPages) : 0
  const totalRecords = Math.max(0, pagination?.totalRecords ?? 0)
  const items = useMemo(() => {
    // Pagination's current API requires a dense list of all page numbers.
    // A normal category catalog will be well below the safety limit.
    return Array.from({ length: Math.min(totalPages, 10000) }, (_, i) => i + 1)
  }, [totalPages])
  const rows = useMemo(() => sortVisibleCategories(categories as Category[], order), [categories, order])
  const hasFilters = searchDraft.trim().length > 0 || status !== 'all' || order !== 'server'

  useEffect(() => {
    // A filtered dataset can shrink after mutations. Avoid landing on a now-empty page.
    if (!loading && !error && totalPages > 0 && page > totalPages) {goToPage(totalPages)}
  }, [loading, error, totalPages, page, goToPage])

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (category: Category) => {
    setForm({
      carProId: category.carProId,
      catName: category.pName ?? '',
      catDescription: category.ProDescription ?? ''
    })
    setFormError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    if (isSaving) {return}
    setModalOpen(false)
    setForm(EMPTY_FORM)
    setFormError('')
  }

  const saveCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSaving) {return}
    const pName = form.catName.trim().replace(/\s+/g, ' ')
    const ProDescription = form.catDescription.trim()
    if (pName.length < 2) {
      setFormError('El nombre debe tener entre 2 y 120 caracteres.')
      return
    }
    if (pName.length > 120) {
      setFormError('El nombre debe contener como máximo 120 caracteres.')
      return
    }

    if (ProDescription.length > 1000) {
      setFormError('La descripción no puede superar los 1000 caracteres.')
      return
    }
    setFormError('')
    setMutationBusy(true)
    try {
      const isEdit = Boolean(form.carProId)
      if (isEdit) {
        const { data } = await editCategory({
          variables: { carProId: form.carProId, pName, ProDescription }
        })
        const result = data?.editOneCategoryProduct
        if (!result?.success) {
          throw new Error(result?.message ?? 'La edición no fue confirmada por el servidor.')
        }
      } else {
        // El hook valida, ejecuta la mutación y actualiza CatProductsPaginated.
        await createCategory({ pName, ProDescription })
      }
      setModalOpen(false)
      setForm(EMPTY_FORM)
      notify('Categoría guardada', isEdit ? 'La categoría fue actualizada.' : 'La categoría fue creada.', 'success')
      // La edición no usa el hook de creación, por eso se refresca por separado.
      if (isEdit) {
        try { await refetch() } catch (refreshError) {
          console.warn('No se pudo refrescar la lista después de editar:', refreshError)
        }
      }
    } catch (e) {
      setFormError(getErrorMessage(e))
      notify('No se pudo guardar', getErrorMessage(e), 'error')
    } finally {
      setMutationBusy(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget || !onDeleteCategory || mutationBusy) {return}
    setMutationBusy(true)
    try {
      await onDeleteCategory(deleteTarget)
      setDeleteTarget(null)
      notify('Categoría eliminada', 'El listado se actualizó.', 'success')
      await refetch()
    } catch (e) {
      notify('No se pudo eliminar', getErrorMessage(e), 'error')
    } finally {
      setMutationBusy(false)
    }
  }

  const clearFilters = () => {
    setSearchDraft('')
    setSearch('')
    setStatus('all')
    setOrder('server')
    goToPage(1)
    searchRef.current?.focus()
  }

  const visibleStart = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1
  const visibleEnd = Math.min(page * pageSize, totalRecords)
  const isSearching = searchDraft.trim() !== search
  const busyList = loading || isSearching

  return (
    <section className={styles.warper_form} aria-label='Gestión de categorías'>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.eyebrow}>Catálogo</p>
          <h2 className={styles.heading}>Categorías de productos</h2>
          <p className={styles.subtitle}>Organiza y administra las categorías de tu establecimiento.</p>
        </div>
        <button type='button' className={styles.primaryAction} onClick={openCreate}>+ Nueva categoría</button>
      </header>

      <div className={styles.filters} role='search' aria-label='Filtros de categorías'>
        <div className={styles.searchField}>
          <label className={styles.fieldLabel} htmlFor='category-search'>Buscar categorías</label>
          <input ref={searchRef} id='category-search' type='search' autoComplete='off'
            className={styles.input} placeholder='Nombre o descripción…'
            value={searchDraft} onChange={event => setSearchDraft(event.target.value)} />
        </div>
        <div className={styles.filterField}>
          <label className={styles.fieldLabel} htmlFor='category-status'>Estado</label>
          <select className={styles.select} id='category-status' value={status}
            onChange={event => setStatus(event.target.value as StatusFilter)}>
            <option value='all'>Todos los estados</option>
            <option value='active'>Activas</option>
            <option value='inactive'>Inactivas</option>
            <option value='archived'>Archivadas</option>
          </select>
        </div>
        <div className={styles.filterField}>
          <label className={styles.fieldLabel} htmlFor='category-order'>Ordenar esta página</label>
          <select className={styles.select} id='category-order' value={order}
            onChange={event => setOrder(event.target.value as PageOrder)}>
            <option value='server'>Más recientes (servidor)</option>
            <option value='oldest'>Más antiguas (página)</option>
            <option value='name-asc'>Nombre A–Z (página)</option>
            <option value='name-desc'>Nombre Z–A (página)</option>
          </select>
        </div>
        <div className={styles.filterField}>
          <label className={styles.fieldLabel} htmlFor='category-page-size'>Por página</label>
          <select className={styles.select} id='category-page-size' value={pageSize}
            onChange={event => setPageSize(Number(event.target.value))}>
            {PAGE_SIZES.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
        <div className={styles.filterActions}>
          <button type='button' className={styles.secondaryAction} disabled={!hasFilters} onClick={clearFilters}>Limpiar</button>
          <button type='button' className={styles.secondaryAction} onClick={() => { void refetch() }} disabled={busyList}>Actualizar</button>
        </div>
      </div>

      <div className={styles.summary} aria-live='polite'>
        <span>{busyList ? 'Actualizando categorías…' : `${totalRecords} categoría${totalRecords === 1 ? '' : 's'} encontrada${totalRecords === 1 ? '' : 's'}`}</span>
        {!busyList && totalRecords > 0 && <span>Mostrando {visibleStart}–{visibleEnd} de {totalRecords}</span>}
      </div>

      <div className={styles.container_form} aria-busy={busyList}>
        {error && !busyList ? (
          <div role='alert' className={styles.feedback}>
            <strong>No se pudieron cargar las categorías.</strong>
            <p>{error.message}</p>
            <button className={styles.secondaryAction} type='button' onClick={() => { void refetch() }}>Reintentar</button>
          </div>
        ) : busyList ? (
          <div className={styles.skeletonList} aria-label='Cargando categorías' role='status'>
            {Array.from({ length: Math.min(pageSize, 6) }, (_, index) => (
              <div className={styles.skeletonRow} key={index} aria-hidden='true'>
                <span className={styles.skeletonCircle}/><span className={styles.skeletonLine}/><span className={styles.skeletonShort}/>
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptySymbol} aria-hidden='true'>▤</span>
            <h3>{hasFilters ? 'No encontramos categorías' : 'Aún no tienes categorías'}</h3>
            <p>{hasFilters ? 'Prueba con otro término o cambia los filtros.' : 'Crea tu primera categoría para organizar los productos.'}</p>
            <button type='button' className={styles.secondaryAction} onClick={hasFilters ? clearFilters : openCreate}>
              {hasFilters ? 'Restablecer filtros' : 'Crear categoría'}
            </button>
          </div>
        ) : (
          <div className={styles.tableScroller}>
            <table className={styles.table}>
              <thead><tr>
                <th scope='col'>Categoría</th><th scope='col'>Descripción</th><th scope='col'>Estado</th>
                <th scope='col'>Creación</th><th scope='col' className={styles.actionHeader}>Acciones</th>
              </tr></thead>
              <tbody>{rows.map(category => (
                <tr key={category.carProId}>
                  <td data-label='Categoría'><span className={styles.categoryName}>{category.pName || 'Sin nombre'}</span></td>
                  <td data-label='Descripción' className={styles.descriptionCell}>{category.ProDescription || 'Sin descripción'}</td>
                  <td data-label='Estado'><span className={`${styles.statusPill} ${category.pState === 1 ? styles.statusActive : category.pState === 0 ? styles.statusInactive : styles.statusArchived}`}>{stateLabel(category.pState)}</span></td>
                  <td data-label='Creación' className={styles.dateCell}>{formatDate(category.createdAt)}</td>
                  <td data-label='Acciones'><div className={styles.rowActions}>
                    <button type='button' className={styles.editAction} onClick={() => openEdit(category)} aria-label={`Editar ${category.pName || 'categoría'}`}>Editar</button>
                    {onDeleteCategory && <button type='button' className={styles.deleteAction} onClick={() => setDeleteTarget(category)} aria-label={`Eliminar ${category.pName || 'categoría'}`}>Eliminar</button>}
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      <footer className={styles.bottom_actions}>
        <div className={styles.paginationCaption}>Página {totalPages ? page : 0} de {totalPages}</div>
        {totalPages > 1 && totalPages <= 10000 && !busyList && !error && (
          <Pagination
            currentPage={Math.min(page, totalPages)} items={items} size='sm'
            loading={false} isVisableButtons isVisableButtonLeft={page > 1}
            isVisableButtonRight={page < totalPages}
            handleOnClick={goToPage} handlePrevPage={previousPage} handleNextPage={nextPage}
          />
        )}
        {totalPages > 10000 && !busyList && !error && (
          <div className={styles.filterActions}>
            <button type='button' className={styles.secondaryAction} disabled={page <= 1} onClick={previousPage}>Anterior</button>
            <button type='button' className={styles.secondaryAction} disabled={page >= totalPages} onClick={nextPage}>Siguiente</button>
          </div>
        )}
      </footer>

      <AwesomeModal
        title={form.carProId ? 'Editar categoría' : 'Nueva categoría'}
        show={modalOpen} onHide={closeModal} onCancel={closeModal} footer={false} header
        size='small' customHeight='min-content' padding='25px'
        zIndex={getGlobalStyle('--z-index-99999')}
      >
        <form onSubmit={event => { void saveCategory(event) }} className={styles.categoryForm}>
          <label htmlFor='category-name'>Nombre de la categoría <span aria-hidden='true'>*</span></label>
          <input id='category-name' className={styles.input} autoFocus required maxLength={120}
            value={form.catName} onChange={event => setForm(current => ({ ...current, catName: event.target.value }))}
            disabled={isSaving} placeholder='Ej. Bebidas' />
          <label htmlFor='category-description'>Descripción</label>
          <textarea id='category-description' className={styles.textarea} rows={4} maxLength={1000}
            value={form.catDescription} onChange={event => setForm(current => ({ ...current, catDescription: event.target.value }))}
            disabled={isSaving} placeholder='Describe esta categoría…' />
          {formError && <p role='alert' className={styles.formError}>{formError}</p>}
          <div className={styles.modalActions}>
            <button type='button' className={styles.secondaryAction} onClick={closeModal} disabled={isSaving}>Cancelar</button>
            <RippleButton type='submit' loading={isSaving}>
              {form.carProId ? 'Guardar cambios' : 'Crear categoría'}
            </RippleButton>
          </div>
        </form>
      </AwesomeModal>

      {deleteTarget && (
        <div className={styles.confirmBackdrop} role='presentation' onMouseDown={event => { if (event.target === event.currentTarget && !mutationBusy) {setDeleteTarget(null)} }}>
          <div role='alertdialog' aria-modal='true' aria-labelledby='delete-title' aria-describedby='delete-description' className={styles.confirmDialog}>
            <h3 id='delete-title'>¿Eliminar categoría?</h3>
            <p id='delete-description'>Se eliminará «{deleteTarget.pName}». Esta acción puede afectar productos asociados.</p>
            <div className={styles.modalActions}>
              <button type='button' className={styles.secondaryAction} disabled={mutationBusy} onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button type='button' className={styles.dangerAction} disabled={mutationBusy} onClick={() => { void confirmDelete() }}>{mutationBusy ? 'Eliminando…' : 'Eliminar'}</button>
            </div>
          </div>
        </div>
      )}
      {!isDragDisabled && <p className={styles.srOnly}>El reordenamiento por arrastre no está disponible en listados paginados porque el servidor no guarda un orden global de categorías.</p>}
    </section>
  )
}

export default Categories
