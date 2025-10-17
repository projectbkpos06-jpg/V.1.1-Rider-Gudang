-- Create reports table
CREATE TABLE reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    rider_id UUID REFERENCES profiles(id),
    report_type VARCHAR(50) NOT NULL, -- 'transaction', 'distribution', etc
    total_amount DECIMAL(12,2) DEFAULT 0,
    total_items INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'completed',
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create report_items table for detailed entries
CREATE TABLE report_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id),
    distribution_id UUID REFERENCES distributions(id),
    amount DECIMAL(12,2) DEFAULT 0,
    quantity INTEGER DEFAULT 0,
    item_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_reports_rider_id ON reports(rider_id);
CREATE INDEX idx_reports_date_range ON reports(start_date, end_date);
CREATE INDEX idx_report_items_report_id ON report_items(report_id);
CREATE INDEX idx_report_items_date ON report_items(item_date);