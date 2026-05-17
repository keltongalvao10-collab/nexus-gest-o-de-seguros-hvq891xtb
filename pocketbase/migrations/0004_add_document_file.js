migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('policies')
    if (!col.fields.getByName('document_file')) {
      col.fields.add(
        new FileField({
          name: 'document_file',
          maxSize: 10485760, // 10MB
          mimeTypes: ['application/pdf'],
          maxSelect: 1,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('policies')
    const field = col.fields.getByName('document_file')
    if (field) {
      col.fields.removeByName('document_file')
      app.save(col)
    }
  },
)
