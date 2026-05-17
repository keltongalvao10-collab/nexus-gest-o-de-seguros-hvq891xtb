migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('policies')
    col.fields.add(
      new RelationField({
        name: 'producer',
        type: 'relation',
        required: false,
        collectionId: '_pb_users_auth_',
        cascadeDelete: false,
        minSelect: null,
        maxSelect: 1,
        displayFields: null,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('policies')
    col.fields.removeByName('producer')
    app.save(col)
  },
)
