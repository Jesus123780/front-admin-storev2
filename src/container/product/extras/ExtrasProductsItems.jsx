import { useDeleteSubProductOptional } from 'npm-pkg-hook'
import { 
  Column, 
  CreateExtra, 
  getGlobalStyle, 
  Icon
} from 'pkg-components'
import PropTypes from 'prop-types'
import React from 'react'

import Items from './Items'
import { Optional } from './Optional'
import { GarnishChoicesHeader } from './styled'

/**
 * Component to render extra products and their options.
 * @param {Object} props - Props for the component.
 * @param {Object} props.propsExtra - Props for the component.
 * @param {Array} props.dataExtra - Data for extra products.
 * @param {Array} props.dataOptional - Data for optional products.
 * @param {boolean} props.disabled - Flag to indicate if the component is disabled.
 * @param {boolean} props.editing - Flag to indicate if the component is in editing mode.
 * @param {any} props.modal - State for the modal.
 * @param {any} props.pId - Product ID.
 * @param {Function} props.setModal - Function to set the modal state.
 * @param {Function} props.handleAddOptional - Function.
 * @param {Function} props.handleIncrementExtra - Function.
 * @param {Function} props.handleDecrementExtra - Function.
 */
export const ExtrasProductsItems = ({
  dataOptional = [],
  editing = true,
  dataExtra = [],
  disabled = false,
  propsExtra = {
    LineItems: {
      Lines: []
    },  
    loading: false,
    modal: false,
    inputRefs: null,
    pId: null,
    selected: {
      loading: false,
      exPid: null
    },
    CleanLines: () => { return },
    handleAdd: () => { return },
    handleEdit: (i, item) => { return { i, item } },
    handleFocusChange: () => { return },
    handleSelect: (item, index) => { return { item, index } },
    handleLineChange: (i, extraName, value) => { return { i, extraName, value }},
    handleRemove: (i, exPid) => { return { i, exPid } },
    onSubmitUpdate: (pId) => { return pId },
    setModal: () => { return },
  },
  ...props
}) => {
  const {
    handleAddOptional,
    handleIncrementExtra,
    handleDecrementExtra
  } = props || {
    handleAddOptional: () => { return },
    handleIncrementExtra: () => { return },
    handleDecrementExtra: () => { return } 
  }

  const handlersPropsOptional = {
    handleAddOptional,
    handleIncrementExtra,
    handleDecrementExtra
  }
  const [_, handleRemoveSubProductOptional] = useDeleteSubProductOptional()
  return (
    <Column>
      {dataExtra?.length > 0 &&
    <div>
      <GarnishChoicesHeader>
        <div>
          <p className='garnish-choices__title'>
            Complementos
          </p>
          <p className='garnish-choices__title-desc'>
            Ingresa tus opciones.
          </p>
        </div>
        <Icon 
          color={getGlobalStyle('--color-feedback-success-dark')}
          icon='IconMiniCheck'
          size={15}
        />
      </GarnishChoicesHeader>
      <Items
        dataExtra={dataExtra}
        disabled={disabled}
        editing={editing}
        handleDecrementExtra={handleDecrementExtra}
        handleIncrementExtra={handleIncrementExtra}
        {...propsExtra}
      />
    </div>
      }
      <Optional
        dataOptional={dataOptional}
        editing={editing}
        handleDeleteItemSubOptional={handleRemoveSubProductOptional}
        handlersPropsOptional={handlersPropsOptional}
        loading={false}
        {...propsExtra}
      />
      {editing &&
      <CreateExtra {...propsExtra} />
      }
    </Column >
  )
}

ExtrasProductsItems.propTypes = {
  dataExtra: PropTypes.array,
  dataOptional: PropTypes.array,
  disabled: PropTypes.bool,
  editing: PropTypes.bool,
  modal: PropTypes.any,
  props: PropTypes.shape({
    handleAddOptional: PropTypes.func,
    handleIncrementExtra: PropTypes.func,
    handleDecrementExtra: PropTypes.func
  }),
  propsExtra: PropTypes.shape({
    LineItems: PropTypes.shape({
      Lines: PropTypes.array
    }),
    loading: PropTypes.bool,
    modal: PropTypes.bool,
    inputRefs: PropTypes.any,
    pId: PropTypes.any,
    selected: PropTypes.shape({
      loading: PropTypes.bool,
      exPid: PropTypes.any
    }),
    CleanLines: PropTypes.func,
    handleAdd: PropTypes.func,
    handleEdit: PropTypes.func,
    handleFocusChange: PropTypes.func,
    handleSelect: PropTypes.func,
    handleLineChange: PropTypes.func,
    handleRemove: PropTypes.func,
    onSubmitUpdate: PropTypes.func,
    setModal: PropTypes.func
  }),
  setModal: PropTypes.func
}

