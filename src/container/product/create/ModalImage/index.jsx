import PropTypes from 'prop-types'
import React from 'react'
// import { Cropper } from 'react-cropper'
import { AwesomeModal } from 'pkg-components'

export const ModalImage = ({
  handleOpenEditImage,
  openEditImage,
  onChange
}) => {
  return (
    <AwesomeModal
      borderRadius='10px'
      btnCancel={true}
      btnConfirm={false}
      footer={false}
      header={true}
      height='50vh'
      onCancel={() => { return handleOpenEditImage() }}
      onHide={() => { return handleOpenEditImage() }}
      padding='25px'
      show={openEditImage}
      size='medium'
      zIndex='90'
    >
      {/* <TagsInput
                defaultTags={tags}
                error={errors.tags}
                id='tags'
                label='Tags'
                // emailValidation={true}
                name='tags'
                onChange={changeHandler}
                placeholder='Add tag'
              /> */}
      <div>
        <div style={{ width: '100%' }}>
          <input onChange={onChange} type='file' />
          <button>Use default img</button>
          <br />
          <br />
          {/* <Cropper
            autoCropArea={1}
            background={false}
            checkOrientation={false}
            guides={true}
            initialAspectRatio={1}
            minCropBoxHeight={10}
            minCropBoxWidth={10}
            onInitialized={(instance) => {
              setCropper(instance)
            }}
            preview='.img-preview'
            responsive={true}
            src={Dimage}
            style={{ height: 400, width: '100%' }} // https://github.com/fengyuanchen/cropperjs/issues/671
            viewMode={1}
            zoomTo={0.5}
          /> */}
        </div>
        <div>
          <div className='box' style={{ width: '50%', float: 'right' }}>
            <h1>Preview</h1>
            <div className='img-preview' style={{ width: '100%', float: 'left', height: '300px' }} />
          </div>
          <div
            className='box'
            style={{ width: '50%', float: 'right', height: '300px' }}
          >
            <h1>
              <span>Crop</span>
              {/* <button onClick={getCropData} style={{ float: 'right' }}>
            Crop Image
              </button> */}
            </h1>
            {/* <img
              alt='cropped'
              src={cropData}
              style={{ width: '100%' }}
            /> */}
          </div>
        </div>
        <br style={{ clear: 'both' }} />
      </div>
      {/* <ContainerEditImage>
      <input
        accept='.jpg, .png'
        id='iFile'
        onChange={handleUpdateBanner}
        ref={fileInputRef}
        type='file'
      />
      <div className='crop-container'>
        <div className='guides'>
          <div>
          </div>
          <div>
          </div>
          <div>
          </div>
          <div>
          </div>
          <div>
          </div>
          <div>
          </div>
          <div>
          </div>
          <div>
          </div>
          <div>
          </div>
        </div>
        <div
          className='crop-overlay'
          style={{
            top: crop.y + '%',
            left: crop.x + '%',
            width: (100 / zoom) + '%',
            height: (100 / zoom) + '%'
          }}
        >
          <img
            alt={alt}
            ref={imageRef}
            src={src}
          />
        </div>
      </div>
      <div className='controls'>
        <Button
          onClick={() => {
            handleOpenEditImage()
            onCropChange({ x: 0, y: 0 })
          } }
        >
          Cancelar
        </Button>
        <input
          max={3}
          min={1}
          onChange={e => {return onZoomChange(e.target.value)}}
          step={0.1}
          type='range'
          value={zoom}
        />
        <Button
          loading={loading || isImgloading}
          onClick={() => {return onCropComplete(crop, getPixelCrop(imageRef.current, crop, zoom))}}
          primary={true}
        >
          Guardar
        </Button>
      </div>
    </ContainerEditImage> */}
    </AwesomeModal>
  )
}

ModalImage.propTypes = {
  handleOpenEditImage: PropTypes.func,
  onChange: PropTypes.func,
  openEditImage: PropTypes.any
}
