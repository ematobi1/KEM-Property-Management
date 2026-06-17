-- Migration: 0003_ledger_immutability_trigger
-- Enforces append-only semantics on financial_ledger_lines at the database level.
-- Corrections are made by inserting ADJUSTMENT or REFUND rows — never by mutating existing rows.

CREATE OR REPLACE FUNCTION fn_prevent_ledger_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION
        'financial_ledger_lines is append-only: % operations are not permitted. '
        'To correct a line, insert an ADJUSTMENT or REFUND row.',
        TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ledger_no_update
    BEFORE UPDATE ON financial_ledger_lines
    FOR EACH ROW EXECUTE FUNCTION fn_prevent_ledger_mutation();

CREATE TRIGGER trg_ledger_no_delete
    BEFORE DELETE ON financial_ledger_lines
    FOR EACH ROW EXECUTE FUNCTION fn_prevent_ledger_mutation();
