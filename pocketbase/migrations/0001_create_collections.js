migrate(
  (app) => {
    // clients
    const clients = new Collection({
      name: 'clients',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email' },
        { name: 'phone', type: 'text' },
        { name: 'document', type: 'text', required: true },
        { name: 'address', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_clients_email ON clients (email) WHERE email != ''",
        "CREATE UNIQUE INDEX idx_clients_document ON clients (document) WHERE document != ''",
      ],
    })
    app.save(clients)

    // insurers
    const insurers = new Collection({
      name: 'insurers',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'document', type: 'text' },
        { name: 'contact_info', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_insurers_document ON insurers (document) WHERE document != ''",
      ],
    })
    app.save(insurers)

    // policies
    const policies = new Collection({
      name: 'policies',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'policy_number', type: 'text', required: true },
        {
          name: 'client',
          type: 'relation',
          required: true,
          collectionId: clients.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'insurer',
          type: 'relation',
          required: true,
          collectionId: insurers.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'start_date', type: 'date', required: true },
        { name: 'end_date', type: 'date', required: true },
        { name: 'total_premium', type: 'number', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['active', 'expired', 'canceled', 'pending'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_policies_number ON policies (policy_number)',
        'CREATE INDEX idx_policies_status ON policies (status)',
        'CREATE INDEX idx_policies_client ON policies (client)',
        'CREATE INDEX idx_policies_insurer ON policies (insurer)',
      ],
    })
    app.save(policies)

    // installments
    const installments = new Collection({
      name: 'installments',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'policy',
          type: 'relation',
          required: true,
          collectionId: policies.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'due_date', type: 'date', required: true },
        { name: 'value', type: 'number', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['paid', 'pending', 'overdue'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_installments_policy ON installments (policy)',
        'CREATE INDEX idx_installments_status ON installments (status)',
      ],
    })
    app.save(installments)

    // commissions
    const commissions = new Collection({
      name: 'commissions',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'policy',
          type: 'relation',
          required: true,
          collectionId: policies.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'amount', type: 'number', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['received', 'pending'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_commissions_policy ON commissions (policy)',
        'CREATE INDEX idx_commissions_status ON commissions (status)',
      ],
    })
    app.save(commissions)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('commissions'))
    app.delete(app.findCollectionByNameOrId('installments'))
    app.delete(app.findCollectionByNameOrId('policies'))
    app.delete(app.findCollectionByNameOrId('insurers'))
    app.delete(app.findCollectionByNameOrId('clients'))
  },
)
