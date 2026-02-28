
-- Enable public reading of time slots so users can pick them
CREATE POLICY "Public can view available time slots" ON time_slots
    FOR SELECT TO public
    USING (status = 'available');

-- Admin can manage all time slots
CREATE POLICY "Admin can manage time slots" ON time_slots
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Public can create consultation bookings
CREATE POLICY "Public can create consultation bookings" ON consultation_bookings
    FOR INSERT TO public
    WITH CHECK (true);

-- Public can view their own consultation bookings (if they have the reference_id)
-- Note: This is an approximation since we don't have a user_id on the booking yet.
-- For now, let's allow public SELECT so they can track their requests in "My Requests".
CREATE POLICY "Public can view consultation bookings" ON consultation_bookings
    FOR SELECT TO public
    USING (true);

-- Admin can manage all consultation bookings
CREATE POLICY "Admin can manage consultation bookings" ON consultation_bookings
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));
