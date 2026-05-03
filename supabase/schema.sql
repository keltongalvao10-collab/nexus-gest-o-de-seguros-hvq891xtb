-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clientes Table
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    documento VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seguradoras Table
CREATE TABLE IF NOT EXISTS seguradoras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    razao_social VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20) UNIQUE NOT NULL,
    ativo BOOLEAN DEFAULT TRUE
);

-- Apolices Table
CREATE TABLE IF NOT EXISTS apolices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_apolice VARCHAR(100) UNIQUE NOT NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    seguradora_id UUID REFERENCES seguradoras(id) ON DELETE CASCADE,
    ramo VARCHAR(100),
    data_inicio DATE NOT NULL,
    data_vencimento DATE NOT NULL,
    valor_premio DECIMAL(15, 2) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Vigente', 'Aguard. Apólice', 'Cancelada', 'Renovação'))
);

-- Parcelas Table
CREATE TABLE IF NOT EXISTS parcelas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    apolice_id UUID REFERENCES apolices(id) ON DELETE CASCADE,
    numero_parcela INT NOT NULL,
    valor DECIMAL(15, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    status_pagamento VARCHAR(50) DEFAULT 'Pendente'
);

-- Comissoes Table
CREATE TABLE IF NOT EXISTS comissoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    apolice_id UUID REFERENCES apolices(id) ON DELETE CASCADE,
    percentual DECIMAL(5, 2) NOT NULL,
    valor_esperado DECIMAL(15, 2) NOT NULL,
    status_recebimento VARCHAR(50) DEFAULT 'Pendente'
);

-- Repasses Table
CREATE TABLE IF NOT EXISTS repasses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    apolice_id UUID REFERENCES apolices(id) ON DELETE CASCADE,
    produtor_id UUID,
    valor DECIMAL(15, 2) NOT NULL,
    data_repasse DATE,
    status VARCHAR(50) DEFAULT 'Pendente'
);

-- Usuarios Table
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    perfil VARCHAR(50) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE
);

-- Enable Row Level Security (RLS)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE seguradoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE apolices ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE repasses ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for application full functionality
CREATE POLICY "Allow all operations for anon" ON clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon" ON seguradoras FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon" ON apolices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon" ON parcelas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon" ON comissoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon" ON repasses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon" ON usuarios FOR ALL USING (true) WITH CHECK (true);
