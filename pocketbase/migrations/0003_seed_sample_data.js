migrate(
  (app) => {
    try {
      app.findFirstRecordByData('insurers', 'name', 'Porto Seguro')
      return
    } catch (_) {}

    const insurersCol = app.findCollectionByNameOrId('insurers')
    const i1 = new Record(insurersCol)
    i1.set('name', 'Porto Seguro')
    i1.set('document', '61198164000160')
    app.save(i1)

    const i2 = new Record(insurersCol)
    i2.set('name', 'SulAmérica')
    i2.set('document', '87747087000100')
    app.save(i2)

    const clientsCol = app.findCollectionByNameOrId('clients')
    const c1 = new Record(clientsCol)
    c1.set('name', 'João da Silva')
    c1.set('document', '11122233344')
    c1.set('email', 'joao@example.com')
    app.save(c1)

    const c2 = new Record(clientsCol)
    c2.set('name', 'Maria Oliveira')
    c2.set('document', '22233344455')
    c2.set('email', 'maria@example.com')
    app.save(c2)

    const c3 = new Record(clientsCol)
    c3.set('name', 'Empresa XYZ')
    c3.set('document', '12345678000199')
    c3.set('email', 'contato@xyz.com')
    app.save(c3)

    const policiesCol = app.findCollectionByNameOrId('policies')
    const p1 = new Record(policiesCol)
    p1.set('policy_number', 'AP-1001')
    p1.set('client', c1.id)
    p1.set('insurer', i1.id)
    p1.set('start_date', '2023-01-01 10:00:00.000Z')
    p1.set('end_date', '2024-01-01 10:00:00.000Z')
    p1.set('total_premium', 1500)
    p1.set('status', 'active')
    app.save(p1)

    const p2 = new Record(policiesCol)
    p2.set('policy_number', 'AP-1002')
    p2.set('client', c2.id)
    p2.set('insurer', i2.id)
    p2.set('start_date', '2023-05-15 10:00:00.000Z')
    p2.set('end_date', '2024-05-15 10:00:00.000Z')
    p2.set('total_premium', 2300)
    p2.set('status', 'pending')
    app.save(p2)

    const p3 = new Record(policiesCol)
    p3.set('policy_number', 'AP-1003')
    p3.set('client', c3.id)
    p3.set('insurer', i1.id)
    p3.set('start_date', '2022-11-20 10:00:00.000Z')
    p3.set('end_date', '2023-11-20 10:00:00.000Z')
    p3.set('total_premium', 5000)
    p3.set('status', 'expired')
    app.save(p3)

    const installmentsCol = app.findCollectionByNameOrId('installments')
    const inst1 = new Record(installmentsCol)
    inst1.set('policy', p1.id)
    inst1.set('due_date', '2023-01-01 10:00:00.000Z')
    inst1.set('value', 1500)
    inst1.set('status', 'paid')
    app.save(inst1)

    const inst2 = new Record(installmentsCol)
    inst2.set('policy', p2.id)
    inst2.set('due_date', '2023-05-15 10:00:00.000Z')
    inst2.set('value', 2300)
    inst2.set('status', 'pending')
    app.save(inst2)

    const commCol = app.findCollectionByNameOrId('commissions')
    const comm1 = new Record(commCol)
    comm1.set('policy', p1.id)
    comm1.set('amount', 300)
    comm1.set('status', 'received')
    app.save(comm1)

    const comm2 = new Record(commCol)
    comm2.set('policy', p2.id)
    comm2.set('amount', 460)
    comm2.set('status', 'pending')
    app.save(comm2)
  },
  (app) => {
    try {
      app.truncateCollection(app.findCollectionByNameOrId('commissions'))
      app.truncateCollection(app.findCollectionByNameOrId('installments'))
      app.truncateCollection(app.findCollectionByNameOrId('policies'))
      app.truncateCollection(app.findCollectionByNameOrId('clients'))
      app.truncateCollection(app.findCollectionByNameOrId('insurers'))
    } catch (_) {}
  },
)
