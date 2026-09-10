// // Generated fields for Form I-912
// import type { Field } from './types';

// export const formId = 'i912';
// export const formTitle = 'Form I-912';
// export const formSubtitle = 'Request for Fee Waiver';

// export const formFields: Field[] = [
//   // === Part 1: Basis for Request ===
//   { key: 'pt1_l0_ImmStatus', pdfKey: 'pt1_l0_immstatus', label: 'Imm Status', type: 'text', section: 'Part 1: Basis for Request' },
//   { key: 'pt1_l1_Checkbox', pdfKey: 'pt1_l1_checkbox', label: 'I, my spouse, or head of household is receiving a means-tested benefit.', type: 'checkbox', section: 'Part 1: Basis for Request' },
//   { key: 'pt1_l1_Checkbox_1', pdfKey: 'pt1_l1_checkbox_1', label: 'My household income is at or below 150 percent of the Federal Poverty Guidelines.', type: 'checkbox', section: 'Part 1: Basis for Request' },
//   { key: 'pt1_l2_Checkbox', pdfKey: 'pt1_l2_checkbox', label: 'I have a financial hardship.', type: 'checkbox', section: 'Part 1: Basis for Request' },
//   { key: 'pt1_l3_Checkbox', pdfKey: 'pt1_l3_checkbox', label: 'Part 1, Item 3', type: 'checkbox', section: 'Part 1: Basis for Request' },
//   // === Part 2: Requestor Info ===
//   { key: 'pt2_l3_AlienNumber', pdfKey: 'pt2_l3_aliennumber', label: 'A-Number', type: 'text', section: 'Part 2: Requestor Info' },
//   { key: 'pt2_l3_FamilyName', pdfKey: 'pt2_l3_familyname', label: 'Family Name (Last Name)', type: 'text', section: 'Part 2: Requestor Info' },
//   { key: 'pt2_l3_GivenName', pdfKey: 'pt2_l3_givenname', label: 'Given Name (First Name)', type: 'text', section: 'Part 2: Requestor Info' },
//   { key: 'pt2_l3_MiddleName', pdfKey: 'pt2_l3_middlename', label: 'Middle Name', type: 'text', section: 'Part 2: Requestor Info' },
//   { key: 'pt2_l4_AcctIdentifier', pdfKey: 'pt2_l4_acctidentifier', label: 'Acct Identifier', type: 'text', section: 'Part 2: Requestor Info' },
//   { key: 'pt2_lL2_FamilyName', pdfKey: 'pt2_ll2_familyname', label: 'Family Name (Last Name)', type: 'text', section: 'Part 2: Requestor Info' },
//   { key: 'pt2_lL2_GivenName', pdfKey: 'pt2_ll2_givenname', label: 'Given Name (First Name)', type: 'text', section: 'Part 2: Requestor Info' },
//   { key: 'pt2_lL2_MiddleName', pdfKey: 'pt2_ll2_middlename', label: 'Middle Name', type: 'text', section: 'Part 2: Requestor Info' },
//   { key: 'pt2_lL3_FamilyName', pdfKey: 'pt2_ll3_familyname', label: 'Family Name (Last Name)', type: 'text', section: 'Part 2: Requestor Info' },
//   { key: 'pt2_lL3_GivenName', pdfKey: 'pt2_ll3_givenname', label: 'Given Name (First Name)', type: 'text', section: 'Part 2: Requestor Info' },
//   { key: 'pt2_lL3_MiddleName', pdfKey: 'pt2_ll3_middlename', label: 'Middle Name', type: 'text', section: 'Part 2: Requestor Info' },
//   { key: 'pt2_l5_DateOfBirth', pdfKey: 'pt2_l5_dateofbirth', label: 'Date of Birth (mm/dd/yyyy)', type: 'date', section: 'Part 2: Requestor Info' },
//   { key: 'pt2_l6_SSN', pdfKey: 'pt2_l6_ssn', label: 'Social Security Number', type: 'text', section: 'Part 2: Requestor Info' },
//   { key: 'pt2_l7_MaritalStatus', pdfKey: 'pt2_l7_maritalstatus', label: 'Marital Status', type: 'checkbox', section: 'Part 2: Requestor Info' },
//   { key: 'pt2_l7_MaritalStatus_1', pdfKey: 'pt2_l7_maritalstatus_1', label: 'Marital Status (Item 2)', type: 'checkbox', section: 'Part 2: Requestor Info' },
//   { key: 'pt2_l7_MaritalStatus_2', pdfKey: 'pt2_l7_maritalstatus_2', label: 'Marital Status (Item 3)', type: 'checkbox', section: 'Part 2: Requestor Info' },
//   { key: 'pt2_l7_MaritalStatus_3', pdfKey: 'pt2_l7_maritalstatus_3', label: 'Marital Status (Item 4)', type: 'checkbox', section: 'Part 2: Requestor Info' },
//   { key: 'pt2_l7_MaritalStatus_4', pdfKey: 'pt2_l7_maritalstatus_4', label: 'Marital Status (Item 5)', type: 'checkbox', section: 'Part 2: Requestor Info' },
//   { key: 'pt2_l7_MaritalStatus_5', pdfKey: 'pt2_l7_maritalstatus_5', label: 'Marital Status (Item 6)', type: 'checkbox', section: 'Part 2: Requestor Info' },
//   { key: 'pt2_l7_MaritalStatus_6', pdfKey: 'pt2_l7_maritalstatus_6', label: 'Marital Status (Item 7)', type: 'checkbox', section: 'Part 2: Requestor Info' },
//   { key: 'pt2_l7_OtherText', pdfKey: 'pt2_l7_othertext', label: 'Other Text', type: 'text', section: 'Part 2: Requestor Info' },
//   { key: 'pt2_l3_AlienNumber_1', pdfKey: 'pt2_l3_aliennumber_1', label: 'A-Number (Item 2)', type: 'text', section: 'Part 2: Requestor Info' },
//   { key: 'pt2_lL2_FamilyName_1', pdfKey: 'pt2_ll2_familyname_1', label: 'Family Name (Last Name) (Item 2)', type: 'text', section: 'Part 2: Requestor Info' },
//   { key: 'pt2_lL2_GivenName_1', pdfKey: 'pt2_ll2_givenname_1', label: 'Given Name (First Name) (Item 2)', type: 'text', section: 'Part 2: Requestor Info' },
//   { key: 'pt2_lL2_MiddleName_1', pdfKey: 'pt2_ll2_middlename_1', label: 'Middle Name (Item 2)', type: 'text', section: 'Part 2: Requestor Info' },
//   // === Part 3: Applications ===
//   { key: 'pt3_l1_AlienNumber', pdfKey: 'pt3_l1_aliennumber', label: 'A-Number', type: 'text', section: 'Part 3: Applications' },
//   { key: 'pt3_l1_AlienNumber2', pdfKey: 'pt3_l1_aliennumber2', label: 'Alien Number2', type: 'text', section: 'Part 3: Applications' },
//   { key: 'pt3_l1_AlienNumber3', pdfKey: 'pt3_l1_aliennumber3', label: 'Alien Number3', type: 'text', section: 'Part 3: Applications' },
//   { key: 'pt3_l1_AlienNumber4', pdfKey: 'pt3_l1_aliennumber4', label: 'Alien Number4', type: 'text', section: 'Part 3: Applications' },
//   { key: 'pt3_l1_DateofBirth1', pdfKey: 'pt3_l1_dateofbirth1', label: 'Dateof Birth1', type: 'date', section: 'Part 3: Applications' },
//   { key: 'pt3_l1_DateofBirth2', pdfKey: 'pt3_l1_dateofbirth2', label: 'Dateof Birth2', type: 'date', section: 'Part 3: Applications' },
//   { key: 'pt3_l1_DateofBirth3', pdfKey: 'pt3_l1_dateofbirth3', label: 'Dateof Birth3', type: 'date', section: 'Part 3: Applications' },
//   { key: 'pt3_l1_DateofBirth4', pdfKey: 'pt3_l1_dateofbirth4', label: 'Dateof Birth4', type: 'date', section: 'Part 3: Applications' },
//   { key: 'pt3_l1_FormsFiled1', pdfKey: 'pt3_l1_formsfiled1', label: 'Forms Filed1', type: 'text', section: 'Part 3: Applications' },
//   { key: 'pt3_l1_FormsFiled2', pdfKey: 'pt3_l1_formsfiled2', label: 'Forms Filed2', type: 'text', section: 'Part 3: Applications' },
//   { key: 'pt3_l1_FormsFiled3', pdfKey: 'pt3_l1_formsfiled3', label: 'Forms Filed3', type: 'text', section: 'Part 3: Applications' },
//   { key: 'pt3_l1_FormsFiled4', pdfKey: 'pt3_l1_formsfiled4', label: 'Forms Filed4', type: 'text', section: 'Part 3: Applications' },
//   { key: 'pt3_l1_Name1', pdfKey: 'pt3_l1_name1', label: 'Name1', type: 'text', section: 'Part 3: Applications' },
//   { key: 'pt3_l1_Name2', pdfKey: 'pt3_l1_name2', label: 'Name2', type: 'text', section: 'Part 3: Applications' },
//   { key: 'pt3_l1_Name3', pdfKey: 'pt3_l1_name3', label: 'Name3', type: 'text', section: 'Part 3: Applications' },
//   { key: 'pt3_l1_Name4', pdfKey: 'pt3_l1_name4', label: 'Name4', type: 'text', section: 'Part 3: Applications' },
//   { key: 'pt3_l1_TotalForms', pdfKey: 'pt3_l1_totalforms', label: 'Total Forms', type: 'text', section: 'Part 3: Applications' },
//   { key: 'pt3_l3_Other', pdfKey: 'pt3_l3_other', label: 'Other', type: 'text', section: 'Part 3: Applications' },
//   { key: 'pt3_lL2a_ApplicantsSignature', pdfKey: 'pt3_ll2a_applicantssignature', label: 'Applicants Signature', type: 'text', section: 'Part 3: Applications' },
//   // === Part 4: Benefits ===
//   { key: 'pt4_l1_Agency1', pdfKey: 'pt4_l1_agency1', label: 'Agency1', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_Agency1_1', pdfKey: 'pt4_l1_agency1_1', label: 'Agency1 (Item 2)', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_Agency2', pdfKey: 'pt4_l1_agency2', label: 'Agency2', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_Agency2_1', pdfKey: 'pt4_l1_agency2_1', label: 'Agency2 (Item 2)', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_Agency3', pdfKey: 'pt4_l1_agency3', label: 'Agency3', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_Agency3_1', pdfKey: 'pt4_l1_agency3_1', label: 'Agency3 (Item 2)', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_Agency4', pdfKey: 'pt4_l1_agency4', label: 'Agency4', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_Agency4_1', pdfKey: 'pt4_l1_agency4_1', label: 'Agency4 (Item 2)', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_DateAward1', pdfKey: 'pt4_l1_dateaward1', label: 'Date Award1', type: 'date', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_DateAward1_1', pdfKey: 'pt4_l1_dateaward1_1', label: 'Date Award1 (Item 2)', type: 'date', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_DateAward2', pdfKey: 'pt4_l1_dateaward2', label: 'Date Award2', type: 'date', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_DateAward2_1', pdfKey: 'pt4_l1_dateaward2_1', label: 'Date Award2 (Item 2)', type: 'date', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_DateAward3', pdfKey: 'pt4_l1_dateaward3', label: 'Date Award3', type: 'date', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_DateAward3_1', pdfKey: 'pt4_l1_dateaward3_1', label: 'Date Award3 (Item 2)', type: 'date', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_DateAward4', pdfKey: 'pt4_l1_dateaward4', label: 'Date Award4', type: 'date', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_DateAward4_1', pdfKey: 'pt4_l1_dateaward4_1', label: 'Date Award4 (Item 2)', type: 'date', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_ExpDate1', pdfKey: 'pt4_l1_expdate1', label: 'Exp Date1', type: 'date', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_ExpDate1_1', pdfKey: 'pt4_l1_expdate1_1', label: 'Exp Date1 (Item 2)', type: 'date', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_ExpDate2', pdfKey: 'pt4_l1_expdate2', label: 'Exp Date2', type: 'date', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_ExpDate2_1', pdfKey: 'pt4_l1_expdate2_1', label: 'Exp Date2 (Item 2)', type: 'date', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_ExpDate3', pdfKey: 'pt4_l1_expdate3', label: 'Exp Date3', type: 'date', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_ExpDate3_1', pdfKey: 'pt4_l1_expdate3_1', label: 'Exp Date3 (Item 2)', type: 'date', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_ExpDate4', pdfKey: 'pt4_l1_expdate4', label: 'Exp Date4', type: 'date', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_ExpDate4_1', pdfKey: 'pt4_l1_expdate4_1', label: 'Exp Date4 (Item 2)', type: 'date', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_FullName1', pdfKey: 'pt4_l1_fullname1', label: 'Full Name1', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_FullName1_1', pdfKey: 'pt4_l1_fullname1_1', label: 'Full Name1 (Item 2)', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_FullName2', pdfKey: 'pt4_l1_fullname2', label: 'Full Name2', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_FullName2_1', pdfKey: 'pt4_l1_fullname2_1', label: 'Full Name2 (Item 2)', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_FullName3', pdfKey: 'pt4_l1_fullname3', label: 'Full Name3', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_FullName3_1', pdfKey: 'pt4_l1_fullname3_1', label: 'Full Name3 (Item 2)', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_FullName4', pdfKey: 'pt4_l1_fullname4', label: 'Full Name4', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_FullName4_1', pdfKey: 'pt4_l1_fullname4_1', label: 'Full Name4 (Item 2)', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_Relationship1', pdfKey: 'pt4_l1_relationship1', label: 'Relationship1', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_Relationship1_1', pdfKey: 'pt4_l1_relationship1_1', label: 'Relationship1 (Item 2)', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_Relationship2', pdfKey: 'pt4_l1_relationship2', label: 'Relationship2', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_Relationship2_1', pdfKey: 'pt4_l1_relationship2_1', label: 'Relationship2 (Item 2)', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_Relationship3', pdfKey: 'pt4_l1_relationship3', label: 'Relationship3', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_Relationship3_1', pdfKey: 'pt4_l1_relationship3_1', label: 'Relationship3 (Item 2)', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_Relationship4', pdfKey: 'pt4_l1_relationship4', label: 'Relationship4', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_Relationship4_1', pdfKey: 'pt4_l1_relationship4_1', label: 'Relationship4 (Item 2)', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_TypeofBene1', pdfKey: 'pt4_l1_typeofbene1', label: 'Typeof Bene1', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_TypeofBene1_1', pdfKey: 'pt4_l1_typeofbene1_1', label: 'Typeof Bene1 (Item 2)', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_TypeofBene2', pdfKey: 'pt4_l1_typeofbene2', label: 'Typeof Bene2', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_TypeofBene2_1', pdfKey: 'pt4_l1_typeofbene2_1', label: 'Typeof Bene2 (Item 2)', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_TypeofBene3', pdfKey: 'pt4_l1_typeofbene3', label: 'Typeof Bene3', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_TypeofBene3_1', pdfKey: 'pt4_l1_typeofbene3_1', label: 'Typeof Bene3 (Item 2)', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_TypeofBene4', pdfKey: 'pt4_l1_typeofbene4', label: 'Typeof Bene4', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l1_TypeofBene4_1', pdfKey: 'pt4_l1_typeofbene4_1', label: 'Typeof Bene4 (Item 2)', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l2a_RelationshipToYou1', pdfKey: 'pt4_l2a_relationshiptoyou1', label: 'Relationship To You1', type: 'text', section: 'Part 4: Benefits' },
//   { key: 'pt4_l2b_DateofBirth2', pdfKey: 'pt4_l2b_dateofbirth2', label: 'Dateof Birth2', type: 'date', section: 'Part 4: Benefits' },
//   { key: 'pt4_l2c_DateofBirth3', pdfKey: 'pt4_l2c_dateofbirth3', label: 'Dateof Birth3', type: 'date', section: 'Part 4: Benefits' },
//   { key: 'pt4_l2d_DateofBirth4', pdfKey: 'pt4_l2d_dateofbirth4', label: 'Dateof Birth4', type: 'date', section: 'Part 4: Benefits' },
//   // === Part 5: Income ===
//   { key: 'pt5_l1_EmploymentStatus', pdfKey: 'pt5_l1_employmentstatus', label: 'Employment Status', type: 'checkbox', section: 'Part 5: Income' },
//   { key: 'pt5_l1_EmploymentStatus_1', pdfKey: 'pt5_l1_employmentstatus_1', label: 'Employment Status (Item 2)', type: 'checkbox', section: 'Part 5: Income' },
//   { key: 'pt5_l1_EmploymentStatus_2', pdfKey: 'pt5_l1_employmentstatus_2', label: 'Employment Status (Item 3)', type: 'checkbox', section: 'Part 5: Income' },
//   { key: 'pt5_l1_EmploymentStatus_3', pdfKey: 'pt5_l1_employmentstatus_3', label: 'Employment Status (Item 4)', type: 'checkbox', section: 'Part 5: Income' },
//   { key: 'pt5_l2_chbxyesno', pdfKey: 'pt5_l2_chbxyesno', label: 'Chbxyesno', type: 'checkbox', section: 'Part 5: Income' },
//   { key: 'pt5_l2_chbxyesno_1', pdfKey: 'pt5_l2_chbxyesno_1', label: 'Chbxyesno (Item 2)', type: 'checkbox', section: 'Part 5: Income' },
//   { key: 'pt5_l2a_DateOfUnemployment', pdfKey: 'pt5_l2a_dateofunemployment', label: 'Date of Unemployment', type: 'date', section: 'Part 5: Income' },
//   { key: 'pt5_l3_TotalHouseSize', pdfKey: 'pt5_l3_totalhousesize', label: 'Total House Size', type: 'text', section: 'Part 5: Income' },
//   { key: 'pt5_l4_TotalHousehold', pdfKey: 'pt5_l4_totalhousehold', label: 'Total Household', type: 'text', section: 'Part 5: Income' },
//   { key: 'pt5_l5_NameHousehold', pdfKey: 'pt5_l5_namehousehold', label: 'Name Household', type: 'text', section: 'Part 5: Income' },
//   { key: 'pt5_l9_checkbox', pdfKey: 'pt5_l9_checkbox', label: 'Part 5, Item 9', type: 'checkbox', section: 'Part 5: Income' },
//   { key: 'pt5_l9_checkbox_1', pdfKey: 'pt5_l9_checkbox_1', label: 'Part 5, Item 9', type: 'checkbox', section: 'Part 5: Income' },
//   { key: 'pt5_l9_Explanation', pdfKey: 'pt5_l9_explanation', label: 'Explanation', type: 'text', section: 'Part 5: Income' },
//   // === Part 6: Hardship ===
//   { key: 'pt6_l1_Situation', pdfKey: 'pt6_l1_situation', label: 'Situation', type: 'text', section: 'Part 6: Hardship' },
//   { key: 'pt6_l3_Checkbox', pdfKey: 'pt6_l3_checkbox', label: 'Part 6, Item 3', type: 'checkbox', section: 'Part 6: Hardship' },
//   { key: 'pt6_l3_Checkbox_1', pdfKey: 'pt6_l3_checkbox_1', label: 'Part 6, Item 3', type: 'checkbox', section: 'Part 6: Hardship' },
//   { key: 'pt6_l3_Checkbox_10', pdfKey: 'pt6_l3_checkbox_10', label: 'Part 6, Item 3', type: 'checkbox', section: 'Part 6: Hardship' },
//   { key: 'pt6_l3_Checkbox_2', pdfKey: 'pt6_l3_checkbox_2', label: 'Part 6, Item 3', type: 'checkbox', section: 'Part 6: Hardship' },
//   { key: 'pt6_l3_Checkbox_3', pdfKey: 'pt6_l3_checkbox_3', label: 'Part 6, Item 3', type: 'checkbox', section: 'Part 6: Hardship' },
//   { key: 'pt6_l3_Checkbox_4', pdfKey: 'pt6_l3_checkbox_4', label: 'Part 6, Item 3', type: 'checkbox', section: 'Part 6: Hardship' },
//   { key: 'pt6_l3_Checkbox_5', pdfKey: 'pt6_l3_checkbox_5', label: 'Part 6, Item 3', type: 'checkbox', section: 'Part 6: Hardship' },
//   { key: 'pt6_l3_Checkbox_6', pdfKey: 'pt6_l3_checkbox_6', label: 'Part 6, Item 3', type: 'checkbox', section: 'Part 6: Hardship' },
//   { key: 'pt6_l3_Checkbox_7', pdfKey: 'pt6_l3_checkbox_7', label: 'Part 6, Item 3', type: 'checkbox', section: 'Part 6: Hardship' },
//   { key: 'pt6_l3_Checkbox_8', pdfKey: 'pt6_l3_checkbox_8', label: 'Part 6, Item 3', type: 'checkbox', section: 'Part 6: Hardship' },
//   { key: 'pt6_l3_Checkbox_9', pdfKey: 'pt6_l3_checkbox_9', label: 'Part 6, Item 3', type: 'checkbox', section: 'Part 6: Hardship' },
//   { key: 'pt6_l3_Other', pdfKey: 'pt6_l3_other', label: 'Other', type: 'text', section: 'Part 6: Hardship' },
//   { key: 'pt6_l3_Total', pdfKey: 'pt6_l3_total', label: 'Total', type: 'text', section: 'Part 6: Hardship' },
//   // === Part 7: Requestor Statement ===
//   { key: 'pt7_l0_Check_box', pdfKey: 'pt7_l0_check_box', label: 'Check_Box', type: 'checkbox', section: 'Part 7: Requestor Statement' },
//   { key: 'pt7_l0_Check_box_1', pdfKey: 'pt7_l0_check_box_1', label: 'Check_Box (Item 2)', type: 'checkbox', section: 'Part 7: Requestor Statement' },
//   { key: 'pt7_l0_Check_box_2', pdfKey: 'pt7_l0_check_box_2', label: 'Check_Box (Item 3)', type: 'checkbox', section: 'Part 7: Requestor Statement' },
//   { key: 'pt7_l0_Check_box_3', pdfKey: 'pt7_l0_check_box_3', label: 'Check_Box (Item 4)', type: 'checkbox', section: 'Part 7: Requestor Statement' },
//   { key: 'pt7_l0_Check_box_4', pdfKey: 'pt7_l0_check_box_4', label: 'Check_Box (Item 5)', type: 'checkbox', section: 'Part 7: Requestor Statement' },
//   { key: 'pt7_l0_Check_box_5', pdfKey: 'pt7_l0_check_box_5', label: 'Check_Box (Item 6)', type: 'checkbox', section: 'Part 7: Requestor Statement' },
//   { key: 'pt7_l2a_TypeOfAsset', pdfKey: 'pt7_l2a_typeofasset', label: 'Type of Asset', type: 'text', section: 'Part 7: Requestor Statement' },
//   { key: 'pt7_l2b_TypeOfAsset', pdfKey: 'pt7_l2b_typeofasset', label: 'Type of Asset', type: 'text', section: 'Part 7: Requestor Statement' },
//   { key: 'pt7_l2c_TypeOfAsset', pdfKey: 'pt7_l2c_typeofasset', label: 'Type of Asset', type: 'text', section: 'Part 7: Requestor Statement' },
//   { key: 'pt7_lL1_chbx', pdfKey: 'pt7_ll1_chbx', label: 'Part 7, Item L1', type: 'checkbox', section: 'Part 7: Requestor Statement' },
//   { key: 'pt7_lL1_chbx_1', pdfKey: 'pt7_ll1_chbx_1', label: 'Part 7, Item L1', type: 'checkbox', section: 'Part 7: Requestor Statement' },
//   { key: 'pt7_lL1B_Name', pdfKey: 'pt7_ll1b_name', label: 'Name', type: 'text', section: 'Part 7: Requestor Statement' },
//   { key: 'pt7_lL2_chbx', pdfKey: 'pt7_ll2_chbx', label: 'Part 7, Item L2', type: 'checkbox', section: 'Part 7: Requestor Statement' },
//   { key: 'pt7_lL2_Name', pdfKey: 'pt7_ll2_name', label: 'Name', type: 'text', section: 'Part 7: Requestor Statement' },
//   { key: 'pt7_lL3_DaytimeTelePhoneNumber1', pdfKey: 'pt7_ll3_daytimetelephonenumber1', label: 'Daytime Tele Phone Number1', type: 'text', section: 'Part 7: Requestor Statement' },
//   { key: 'pt7_lL4_MobileTelePhoneNumber1', pdfKey: 'pt7_ll4_mobiletelephonenumber1', label: 'Mobile Tele Phone Number1', type: 'text', section: 'Part 7: Requestor Statement' },
//   { key: 'pt7_lL5_EmailAddress', pdfKey: 'pt7_ll5_emailaddress', label: 'Email Address', type: 'text', section: 'Part 7: Requestor Statement' },
//   { key: 'pt7_lL6_Date', pdfKey: 'pt7_ll6_date', label: 'Date', type: 'date', section: 'Part 7: Requestor Statement' },
//   // === Part 9: Interpreter ===
//   { key: 'pt9_l0_Language', pdfKey: 'pt9_l0_language', label: 'Language', type: 'text', section: 'Part 9: Interpreter' },
//   { key: 'pt9_lL1A_FamilyName', pdfKey: 'pt9_ll1a_familyname', label: 'Family Name (Last Name)', type: 'text', section: 'Part 9: Interpreter' },
//   { key: 'pt9_lL1B_GivenName', pdfKey: 'pt9_ll1b_givenname', label: 'Given Name (First Name)', type: 'text', section: 'Part 9: Interpreter' },
//   { key: 'pt9_lL2_BusOrgName', pdfKey: 'pt9_ll2_busorgname', label: 'Bus org Name', type: 'text', section: 'Part 9: Interpreter' },
//   { key: 'pt9_lL3A_StreetNumberName', pdfKey: 'pt9_ll3a_streetnumbername', label: 'Street Number and Name', type: 'text', section: 'Part 9: Interpreter' },
//   { key: 'pt9_lL3B_AptSteFlrNumber', pdfKey: 'pt9_ll3b_aptsteflrnumber', label: 'Apt./Ste./Flr. Number', type: 'text', section: 'Part 9: Interpreter' },
//   { key: 'pt9_lL3c_City', pdfKey: 'pt9_ll3c_city', label: 'City', type: 'text', section: 'Part 9: Interpreter' },
//   { key: 'pt9_lL3d_State', pdfKey: 'pt9_ll3d_state', label: 'State', type: 'text', section: 'Part 9: Interpreter' },
//   { key: 'pt9_lL3e_ZipCode', pdfKey: 'pt9_ll3e_zipcode', label: 'Zip Code', type: 'text', section: 'Part 9: Interpreter' },
//   { key: 'pt9_lL3f_PostalCode', pdfKey: 'pt9_ll3f_postalcode', label: 'Postal Code', type: 'text', section: 'Part 9: Interpreter' },
//   { key: 'pt9_lL3g_Province', pdfKey: 'pt9_ll3g_province', label: 'Province', type: 'text', section: 'Part 9: Interpreter' },
//   { key: 'pt9_lL3h_Country', pdfKey: 'pt9_ll3h_country', label: 'Country', type: 'text', section: 'Part 9: Interpreter' },
//   { key: 'pt9_lL4_DaytimeTelePhoneNumber1', pdfKey: 'pt9_ll4_daytimetelephonenumber1', label: 'Daytime Tele Phone Number1', type: 'text', section: 'Part 9: Interpreter' },
//   { key: 'pt9_lL4_DaytimeTelePhoneNumber1_1', pdfKey: 'pt9_ll4_daytimetelephonenumber1_1', label: 'Daytime Tele Phone Number1 (Item 2)', type: 'text', section: 'Part 9: Interpreter' },
//   { key: 'pt9_lL5_EmailAddress', pdfKey: 'pt9_ll5_emailaddress', label: 'Email Address', type: 'text', section: 'Part 9: Interpreter' },
//   { key: 'pt9_lL6b_Date', pdfKey: 'pt9_ll6b_date', label: 'Date', type: 'date', section: 'Part 9: Interpreter' },
//   { key: 'pt9_lLB_Unit', pdfKey: 'pt9_llb_unit', label: 'Unit', type: 'checkbox', section: 'Part 9: Interpreter' },
//   { key: 'pt9_lLB_Unit_1', pdfKey: 'pt9_llb_unit_1', label: 'Unit (Item 2)', type: 'checkbox', section: 'Part 9: Interpreter' },
//   { key: 'pt9_lLB_Unit_2', pdfKey: 'pt9_llb_unit_2', label: 'Unit (Item 3)', type: 'checkbox', section: 'Part 9: Interpreter' },
//   // === Part 10: Preparer ===
//   { key: 'pt10_lL6a_InterpretersSignature', pdfKey: 'pt10_ll6a_interpreterssignature', label: 'Interpreters Signature', type: 'text', section: 'Part 10: Preparer' },
//   { key: 'pt10_lL1A_FamilyName', pdfKey: 'pt10_ll1a_familyname', label: 'Family Name (Last Name)', type: 'text', section: 'Part 10: Preparer' },
//   { key: 'pt10_lL1b_GivenName', pdfKey: 'pt10_ll1b_givenname', label: 'Given Name (First Name)', type: 'text', section: 'Part 10: Preparer' },
//   { key: 'pt10_lL2_BusOrgName', pdfKey: 'pt10_ll2_busorgname', label: 'Bus org Name', type: 'text', section: 'Part 10: Preparer' },
//   { key: 'pt10_lL3a_StreetNumberName', pdfKey: 'pt10_ll3a_streetnumbername', label: 'Street Number and Name', type: 'text', section: 'Part 10: Preparer' },
//   { key: 'pt10_lL3b_AptSteFlrNumber', pdfKey: 'pt10_ll3b_aptsteflrnumber', label: 'Apt./Ste./Flr. Number', type: 'text', section: 'Part 10: Preparer' },
//   { key: 'pt10_lL3b_Unit', pdfKey: 'pt10_ll3b_unit', label: 'Unit', type: 'checkbox', section: 'Part 10: Preparer' },
//   { key: 'pt10_lL3b_Unit_1', pdfKey: 'pt10_ll3b_unit_1', label: 'Unit (Item 2)', type: 'checkbox', section: 'Part 10: Preparer' },
//   { key: 'pt10_lL3b_Unit_2', pdfKey: 'pt10_ll3b_unit_2', label: 'Unit (Item 3)', type: 'checkbox', section: 'Part 10: Preparer' },
//   { key: 'pt10_lL3c_City', pdfKey: 'pt10_ll3c_city', label: 'City', type: 'text', section: 'Part 10: Preparer' },
//   { key: 'pt10_lL3d_State', pdfKey: 'pt10_ll3d_state', label: 'State', type: 'text', section: 'Part 10: Preparer' },
//   { key: 'pt10_lL3e_ZipCode', pdfKey: 'pt10_ll3e_zipcode', label: 'Zip Code', type: 'text', section: 'Part 10: Preparer' },
//   { key: 'pt10_lL3f_PostalCode', pdfKey: 'pt10_ll3f_postalcode', label: 'Postal Code', type: 'text', section: 'Part 10: Preparer' },
//   { key: 'pt10_lL3g_Province', pdfKey: 'pt10_ll3g_province', label: 'Province', type: 'text', section: 'Part 10: Preparer' },
//   { key: 'pt10_lL3h_Country', pdfKey: 'pt10_ll3h_country', label: 'Country', type: 'text', section: 'Part 10: Preparer' },
//   { key: 'pt10_lL4_DaytimeTelePhoneNumber1', pdfKey: 'pt10_ll4_daytimetelephonenumber1', label: 'Daytime Tele Phone Number1', type: 'text', section: 'Part 10: Preparer' },
//   { key: 'pt10_lL5_FaxNumber1', pdfKey: 'pt10_ll5_faxnumber1', label: 'Fax Number1', type: 'text', section: 'Part 10: Preparer' },
//   { key: 'pt10_lL6_EmailAddress', pdfKey: 'pt10_ll6_emailaddress', label: 'Email Address', type: 'text', section: 'Part 10: Preparer' },
//   { key: 'pt10_lL7_chbx', pdfKey: 'pt10_ll7_chbx', label: 'Part 10, Item L7', type: 'checkbox', section: 'Part 10: Preparer' },
//   { key: 'pt10_lL7_chbx_1', pdfKey: 'pt10_ll7_chbx_1', label: 'Part 10, Item L7', type: 'checkbox', section: 'Part 10: Preparer' },
//   { key: 'pt10_lL7B_chbx', pdfKey: 'pt10_ll7b_chbx', label: 'Part 10, Item L7B', type: 'checkbox', section: 'Part 10: Preparer' },
//   { key: 'pt10_lL7B_chbx_1', pdfKey: 'pt10_ll7b_chbx_1', label: 'Part 10, Item L7B', type: 'checkbox', section: 'Part 10: Preparer' },
//   { key: 'pt10_lL8B_Date', pdfKey: 'pt10_ll8b_date', label: 'Date', type: 'date', section: 'Part 10: Preparer' },
//   // === Part 11: Additional Info ===
//   { key: 'pt11_lL2_InterpretersSignature', pdfKey: 'pt11_ll2_interpreterssignature', label: 'Interpreters Signature', type: 'text', section: 'Part 11: Additional Info' },
//   { key: 'pt11_l3a_PageNumber', pdfKey: 'pt11_l3a_pagenumber', label: 'Page Number', type: 'text', section: 'Part 11: Additional Info' },
//   { key: 'pt11_l3b_PartNumber', pdfKey: 'pt11_l3b_partnumber', label: 'Part Number', type: 'text', section: 'Part 11: Additional Info' },
//   { key: 'pt11_l3c_ItemNumber', pdfKey: 'pt11_l3c_itemnumber', label: 'Item Number', type: 'text', section: 'Part 11: Additional Info' },
//   { key: 'pt11_l3d_AdditionalInfo', pdfKey: 'pt11_l3d_additionalinfo', label: 'Additional Info', type: 'text', section: 'Part 11: Additional Info' },
//   { key: 'pt11_l4a_PageNumber', pdfKey: 'pt11_l4a_pagenumber', label: 'Page Number', type: 'text', section: 'Part 11: Additional Info' },
//   { key: 'pt11_l4b_PartNumber', pdfKey: 'pt11_l4b_partnumber', label: 'Part Number', type: 'text', section: 'Part 11: Additional Info' },
//   { key: 'pt11_l4c_ItemNumber', pdfKey: 'pt11_l4c_itemnumber', label: 'Item Number', type: 'text', section: 'Part 11: Additional Info' },
//   { key: 'pt11_l5a_PageNumber', pdfKey: 'pt11_l5a_pagenumber', label: 'Page Number', type: 'text', section: 'Part 11: Additional Info' },
//   { key: 'pt11_l5b_PartNumber', pdfKey: 'pt11_l5b_partnumber', label: 'Part Number', type: 'text', section: 'Part 11: Additional Info' },
//   { key: 'pt11_l5c_ItemNumber', pdfKey: 'pt11_l5c_itemnumber', label: 'Item Number', type: 'text', section: 'Part 11: Additional Info' },
//   { key: 'pt11_l5d_AdditionalInfo', pdfKey: 'pt11_l5d_additionalinfo', label: 'Additional Info', type: 'text', section: 'Part 11: Additional Info' },
//   { key: 'pt11_l6a_PageNumber', pdfKey: 'pt11_l6a_pagenumber', label: 'Page Number', type: 'text', section: 'Part 11: Additional Info' },
//   { key: 'pt11_l6b_PartNumber', pdfKey: 'pt11_l6b_partnumber', label: 'Part Number', type: 'text', section: 'Part 11: Additional Info' },
//   { key: 'pt11_l6c_ItemNumber', pdfKey: 'pt11_l6c_itemnumber', label: 'Item Number', type: 'text', section: 'Part 11: Additional Info' },
//   // === Part 12 ===
//   { key: 'pt12_l4d_AdditionalInfo', pdfKey: 'pt12_l4d_additionalinfo', label: 'Additional Info', type: 'text', section: 'Part 12' },
//   { key: 'pt12_l6d_AdditionalInfo', pdfKey: 'pt12_l6d_additionalinfo', label: 'Additional Info', type: 'text', section: 'Part 12' },
// ];

// export const getInitialFormData = () => {
//   const data: Record<string, string> = {};
//   formFields.forEach((f) => { if (f.key) data[f.key] = ''; });
//   return data;
// };

// export const i912Config = { formId, formTitle, formSubtitle, formFields, getInitialFormData };
// export default i912Config;

// Generated fields for Form I-912
// Enriched with conversational language, hints, help text, examples, validation,
// skip labels, options, subQuestions, and conditions — matching the i864a style.

import type { Field } from "./types";

export const formId = "i912";
export const formTitle = "Form I-912";
export const formSubtitle = "Request for Fee Waiver";

// ─── Section intro messages ────────────────────────────────────────────────
export const sectionIntroMessages = {
  "Quick check": {
    greeting: "Before we start.",
    message:
      "A couple of quick questions to make sure this is the right form for you and which parts you need to fill out.",
  },
  "Part 1: Basis for Request": {
    greeting: "Why are you asking for a fee waiver?",
    message:
      "You only need to qualify for one reason, but you can select more than one if you want. Each reason requires different supporting documents, so pick everything that applies to you.",
  },
  "Part 2: Requestor Info": {
    greeting: "Let's start with who is asking.",
    message:
      "This is about the person the fee waiver is for. Usually that's you, but if you're a parent or guardian filing for a child or someone with a disability, fill this out for them instead.",
  },
  "Part 3: Applications": {
    greeting: "Which forms need the fee waiver?",
    message:
      "List every application or petition you want covered. Each person and form type gets its own row in the table.",
  },
  "Part 4: Benefits": {
    greeting: "Who in your household receives government benefits?",
    message:
      'Only needed if you selected "means-tested benefit" in Part 1. List anyone in your household who receives a qualifying benefit, things like Medicaid, SNAP (food stamps), SSI, or TANF.',
  },
  "Part 5: Income": {
    greeting: "Let's look at your household income.",
    message:
      'Only needed if you selected "household income at or below 150% of the Federal Poverty Guidelines" in Part 1. Use your most recent federal tax return to find your Adjusted Gross Income (AGI), that\'s Line 11 on Form 1040.',
  },
  "Part 6: Hardship": {
    greeting: "Tell us about your financial hardship.",
    message:
      'Only needed if you selected "financial hardship" in Part 1. Describe what\'s going on, medical debt, job loss, homelessness, natural disaster, anything that explains why paying the fee right now is genuinely difficult.',
  },
  "Part 7: Requestor Statement": {
    greeting: "Almost done, your signature.",
    message:
      "By signing, you're certifying everything you've written is true and complete. Read the certification carefully before you sign.",
  },
  "Part 8: Interpreter": {
    greeting: "Was a translator involved?",
    message:
      "If anyone needed the form read to them in another language, the translator's details go here. Skip this section if you read it in English directly.",
  },
  "Part 9: Preparer": {
    greeting: "Did someone fill this form out for you?",
    message:
      "If a lawyer, paralegal, or anyone else typed in your answers based on what you told them, their details go here. This is separate from a translator.",
  },
  "Part 10: Additional Info": {
    greeting: "Need more room?",
    message:
      "If any earlier answer was too long to fit, continue it here. Reference the page, part, and item number so USCIS knows where it belongs.",
  },
};

// ─── Extended Field type ───────────────────────────────────────────────────
export interface RichField extends Field {
  hint?: string;
  help?: string;
  find?: string;
  example?: string;
  validate?: (value: string) => string | null;
  skip?: string;
  isIncomeField?: boolean;
  isAssetField?: boolean;
  calcLabelA?: string;
  calcLabelB?: string;
  options?: Array<{ value: string; label: string; sublabel?: string }>;
  placeholder?: string;
  condition?: (data: Record<string, unknown>) => boolean | null | undefined;
  subQuestions?: RichField[];
}

// ─── Form fields ───────────────────────────────────────────────────────────
export const formFields: RichField[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // ELIGIBILITY / QUICK CHECK
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "elig_guardian",
    pdfKey: "",
    label: "Are you filling this out for yourself, or for someone else?",
    hint: 'If you\'re a parent or legal guardian applying on behalf of a child or someone with a developmental or mental disability, choose "For someone else."',
    type: "radio",
    section: "Quick check",
    options: [
      { value: "self", label: "For myself", sublabel: "The fee waiver is for my own application." },
      {
        value: "other",
        label: "For someone else",
        sublabel: "I'm a parent or legal guardian filing on their behalf.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PART 1 — BASIS FOR REQUEST
  // ══════════════════════════════════════════════════════════════════════════

  // Item 1 — Immigrant/nonimmigrant status (shown on form before checkboxes)
  {
    key: "pt1_l0_ImmStatus",
    pdfKey: "pt1_l0_immstatus",
    label: "What is your current immigration status?",
    hint: "This is your visa category or green card type. Examples: LPR (green card holder), asylum seeker, T visa, U visa, DACA, etc.",
    help: 'Look at any notice you received from USCIS, your visa stamp, or your green card. Write exactly what it says, for example "Lawful Permanent Resident," "Asylee," "T Nonimmigrant," or "Pending Adjustment of Status."',
    example: "Lawful Permanent Resident / Asylee / T Nonimmigrant / Pending Adjustment of Status",
    type: "text",
    section: "Part 1: Basis for Request",
    placeholder: "e.g. Asylee / Pending Adjustment of Status",
  },

  // Basis checkboxes — 1A, 1B, 1C
  {
    key: "pt1_l1_Checkbox",
    pdfKey: "pt1_l1_checkbox",
    label: "Basis A: Someone in my household is receiving a means-tested government benefit.",
    hint: "Means-tested benefits include Medicaid, CHIP, SNAP (food stamps), SSI (Supplemental Security Income), TANF (cash assistance), and some others. If you, your spouse, or the head of your household receives any of these, check this box.",
    type: "checkbox",
    section: "Part 1: Basis for Request",
  },
  {
    key: "pt1_l1_Checkbox_1",
    pdfKey: "pt1_l1_checkbox_1",
    label: "Basis B: My household income is at or below 150% of the Federal Poverty Guidelines.",
    hint: "This is a dollar threshold set each year by the federal government. For example, in 2025 a household of 4 qualifies if total income is roughly $47,700 or less. The exact number depends on your household size. You'll provide your income details in Part 5.",
    type: "checkbox",
    section: "Part 1: Basis for Request",
  },
  {
    key: "pt1_l2_Checkbox",
    pdfKey: "pt1_l2_checkbox",
    label: "Basis C: I have a financial hardship.",
    hint: "This is a catch-all for situations where paying the fee would be a genuine hardship, even if your income is above the poverty threshold. Examples: large medical bills, recent job loss, homelessness, natural disaster, disability. You'll describe the situation in Part 6.",
    type: "checkbox",
    section: "Part 1: Basis for Request",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PART 2 — REQUESTOR INFORMATION
  // ══════════════════════════════════════════════════════════════════════════

  // Guardian checkbox (Item 1 on form)
  {
    key: "pt1_l3_Checkbox",
    pdfKey: "pt1_l3_checkbox",
    label:
      "Check this box if you are a parent or legal guardian filing on behalf of the person seeking the fee waiver.",
    hint: 'If you checked "For someone else" at the start, check this box too.',
    type: "checkbox",
    section: "Part 2: Requestor Info",
    condition: (data) => data.elig_guardian === "other",
  },

  // Full name (Item 2)
  {
    key: "pt2_l3_FamilyName",
    pdfKey: "pt2_l3_familyname",
    label: "What is the requestor's last name?",
    help: "Use the exact name on the passport or government ID of the person the fee waiver is for.",
    type: "text",
    section: "Part 2: Requestor Info",
    placeholder: "Last name",
    subQuestions: [
      {
        key: "pt2_l3_GivenName",
        pdfKey: "pt2_l3_givenname",
        label: "First name?",
        type: "text",
        section: "Part 2: Requestor Info",
        placeholder: "First name",
      },
      {
        key: "pt2_l3_MiddleName",
        pdfKey: "pt2_l3_middlename",
        label: "Middle name? (if any)",
        type: "text",
        section: "Part 2: Requestor Info",
        placeholder: "Middle name",
        skip: "No middle name",
      },
    ],
  },

  // Other names (Item 3)
  {
    key: "pt2_lL2_FamilyName",
    pdfKey: "pt2_ll2_familyname",
    label: "Have you ever gone by a different name? (Other names, Item 1)",
    hint: "List any other names you've been known by, nicknames, aliases, maiden name, or name before a legal change. Leave blank if none.",
    type: "text",
    section: "Part 2: Requestor Info",
    placeholder: "Last name",
    skip: "No other names",
    subQuestions: [
      {
        key: "pt2_lL2_GivenName",
        pdfKey: "pt2_ll2_givenname",
        label: "First name for this other name?",
        type: "text",
        section: "Part 2: Requestor Info",
        placeholder: "First name",
      },
      {
        key: "pt2_lL2_MiddleName",
        pdfKey: "pt2_ll2_middlename",
        label: "Middle name for this other name? (if any)",
        type: "text",
        section: "Part 2: Requestor Info",
        placeholder: "Middle name",
        skip: "No middle name",
      },
    ],
  },
  {
    key: "pt2_hasOtherName2",
    pdfKey: "",
    label: "Any other names to add?",
    type: "radio",
    section: "Part 2: Requestor Info",
    options: [
      { value: "Yes", label: "Yes, one more" },
      { value: "No", label: "No, that's all" },
    ],
  },
  {
    key: "pt2_lL3_FamilyName",
    pdfKey: "pt2_ll3_familyname",
    label: "Other name (Item 2), last name?",
    type: "text",
    section: "Part 2: Requestor Info",
    placeholder: "Last name",
    condition: (data) => data.pt2_hasOtherName2 === "Yes",
    subQuestions: [
      {
        key: "pt2_lL3_GivenName",
        pdfKey: "pt2_ll3_givenname",
        label: "First name?",
        type: "text",
        section: "Part 2: Requestor Info",
        placeholder: "First name",
      },
      {
        key: "pt2_lL3_MiddleName",
        pdfKey: "pt2_ll3_middlename",
        label: "Middle name? (if any)",
        type: "text",
        section: "Part 2: Requestor Info",
        placeholder: "Middle name",
        skip: "No middle name",
      },
    ],
  },

  // A-Number (Item 4)
  {
    key: "pt2_l3_AlienNumber",
    pdfKey: "pt2_l3_aliennumber",
    label: "Do you have an Alien Registration Number (A-Number)?",
    help: "An A-Number starts with the letter \"A\" followed by 8 or 9 digits, like A123456789. You'd have one if you've ever had a green card, work permit (EAD), or a formal immigration case. If you've never had any of those, you probably don't have one.",
    find: 'Front of your green card or work permit, look for "A-Number" or "USCIS#."',
    example: "Card says A123456789, type: 123456789",
    type: "text",
    section: "Part 2: Requestor Info",
    placeholder: "8 or 9 digits (no letter A)",
    skip: "I don't have an A-Number",
    validate: (v) => (!v || /^\d{8,9}$/.test(v) ? null : "8 or 9 digits, no letter A"),
  },

  // USCIS Online Account Number (Item 5)
  {
    key: "pt2_l4_AcctIdentifier",
    pdfKey: "pt2_l4_acctidentifier",
    label: "Do you have a USCIS Online Account Number?",
    help: "Only assigned if you've personally created an account on my.uscis.gov. It's a website login number, not the same as an A-Number, and not on any physical card. If you've never set one up, you don't have one.",
    find: 'Log into my.uscis.gov -> click your profile icon -> look for "USCIS Online Account Number."',
    type: "text",
    section: "Part 2: Requestor Info",
    placeholder: "8 to 12 digits",
    skip: "I don't have a USCIS Online Account Number",
    validate: (v) => (!v || /^\d{8,12}$/.test(v) ? null : "Should be 8 to 12 digits"),
  },

  // Date of birth (Item 6)
  {
    key: "pt2_l5_DateOfBirth",
    pdfKey: "pt2_l5_dateofbirth",
    label: "What is the requestor's date of birth?",
    find: "Passport photo page, or birth certificate.",
    type: "date",
    section: "Part 2: Requestor Info",
    placeholder: "MM/DD/YYYY",
  },

  // SSN (Item 7)
  {
    key: "pt2_l6_SSN",
    pdfKey: "pt2_l6_ssn",
    label: "Do you have a U.S. Social Security Number (SSN)?",
    help: "A 9-digit number issued by the U.S. government. It's on your Social Security card, and also appears on any W-2 tax form. Not everyone has one, that's fine.",
    find: "Your Social Security card, or the top-left area of any W-2 form.",
    example: "Card shows 123-45-6789, type: 123456789",
    type: "text",
    section: "Part 2: Requestor Info",
    placeholder: "9 digits, no dashes",
    skip: "I don't have a Social Security Number",
    validate: (v) => (!v || /^\d{9}$/.test(v) ? null : "Exactly 9 digits, no dashes or spaces"),
  },

  // Marital status (Item 8)
  {
    key: "pt2_l7_MaritalStatus",
    pdfKey: "pt2_l7_maritalstatus",
    label: "What is your marital status?",
    hint: "Pick the one that describes your current situation.",
    type: "radio",
    section: "Part 2: Requestor Info",
    options: [
      { value: "single", label: "Single, never married" },
      { value: "married", label: "Married" },
      { value: "divorced", label: "Divorced" },
      { value: "widowed", label: "Widowed" },
      { value: "annulled", label: "Marriage annulled" },
      { value: "separated", label: "Separated" },
      { value: "other", label: "Other" },
    ],
    subQuestions: [
      {
        key: "pt2_l7_MaritalStatus_1",
        pdfKey: "pt2_l7_maritalstatus_1",
        label: "Single, Never Married",
        type: "checkbox",
        section: "Part 2: Requestor Info",
      },
      {
        key: "pt2_l7_MaritalStatus_2",
        pdfKey: "pt2_l7_maritalstatus_2",
        label: "Married",
        type: "checkbox",
        section: "Part 2: Requestor Info",
      },
      {
        key: "pt2_l7_MaritalStatus_3",
        pdfKey: "pt2_l7_maritalstatus_3",
        label: "Divorced",
        type: "checkbox",
        section: "Part 2: Requestor Info",
      },
      {
        key: "pt2_l7_MaritalStatus_4",
        pdfKey: "pt2_l7_maritalstatus_4",
        label: "Widowed",
        type: "checkbox",
        section: "Part 2: Requestor Info",
      },
      {
        key: "pt2_l7_MaritalStatus_5",
        pdfKey: "pt2_l7_maritalstatus_5",
        label: "Marriage Annulled",
        type: "checkbox",
        section: "Part 2: Requestor Info",
      },
      {
        key: "pt2_l7_MaritalStatus_6",
        pdfKey: "pt2_l7_maritalstatus_6",
        label: "Separated",
        type: "checkbox",
        section: "Part 2: Requestor Info",
      },
      {
        key: "pt2_l7_OtherText",
        pdfKey: "pt2_l7_othertext",
        label: "Describe your marital status.",
        type: "text",
        section: "Part 2: Requestor Info",
        placeholder: "Explain your situation",
        condition: (data) => data.pt2_l7_MaritalStatus === "other",
      },
    ],
  },

  // Additional family member who also needs the waiver (Item 3 — second person in Part 2)
  {
    key: "pt2_hasSecondPerson",
    pdfKey: "",
    label: "Is there a second family member also included in this fee waiver request?",
    hint: "Sometimes a parent files one I-912 covering both themselves and a child. If so, add the child's details here.",
    type: "radio",
    section: "Part 2: Requestor Info",
    options: [
      { value: "Yes", label: "Yes, another person is included" },
      { value: "No", label: "No, just me (or the person named above)" },
    ],
  },
  {
    key: "pt2_l3_AlienNumber_1",
    pdfKey: "pt2_l3_aliennumber_1",
    label: "Second person, A-Number (if any)?",
    type: "text",
    section: "Part 2: Requestor Info",
    placeholder: "8 or 9 digits",
    skip: "No A-Number",
    condition: (data) => data.pt2_hasSecondPerson === "Yes",
    validate: (v) => (!v || /^\d{8,9}$/.test(v) ? null : "8 or 9 digits, no letter A"),
  },
  {
    key: "pt2_lL2_FamilyName_1",
    pdfKey: "pt2_ll2_familyname_1",
    label: "Second person, last name?",
    type: "text",
    section: "Part 2: Requestor Info",
    placeholder: "Last name",
    condition: (data) => data.pt2_hasSecondPerson === "Yes",
    subQuestions: [
      {
        key: "pt2_lL2_GivenName_1",
        pdfKey: "pt2_ll2_givenname_1",
        label: "First name?",
        type: "text",
        section: "Part 2: Requestor Info",
        placeholder: "First name",
      },
      {
        key: "pt2_lL2_MiddleName_1",
        pdfKey: "pt2_ll2_middlename_1",
        label: "Middle name? (if any)",
        type: "text",
        section: "Part 2: Requestor Info",
        placeholder: "Middle name",
        skip: "No middle name",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PART 3 — APPLICATIONS AND PETITIONS
  // ══════════════════════════════════════════════════════════════════════════

  // Row 1
  {
    key: "pt3_l1_Name1",
    pdfKey: "pt3_l1_name1",
    label: "Person #1, full name",
    hint: "List every application or petition you want the fee waiver to cover. Start with yourself (or the main person), then add family members below.",
    type: "text",
    section: "Part 3: Applications",
    placeholder: "Full name",
    subQuestions: [
      {
        key: "pt3_l1_AlienNumber",
        pdfKey: "pt3_l1_aliennumber",
        label: "A-Number (if any)",
        type: "text",
        section: "Part 3: Applications",
        placeholder: "8 or 9 digits",
        skip: "No A-Number",
        tooltip:
          "An A-Number (Alien Registration Number) is a 7 to 9 digit number USCIS gives to non-citizens. You can find it on a green card, work permit, or immigration notices. Leave blank if there is none.",
        validate: (v) => (!v || /^\d{8,9}$/.test(v) ? null : "8 or 9 digits"),
      },
      {
        key: "pt3_l1_DateofBirth1",
        pdfKey: "pt3_l1_dateofbirth1",
        label: "Date of birth",
        type: "date",
        section: "Part 3: Applications",
        placeholder: "MM/DD/YYYY",
      },
      {
        key: "pt3_l1_FormsFiled1",
        pdfKey: "pt3_l1_formsfiled1",
        label: "Form(s) being filed",
        help: "List the form numbers, for example: I-485, I-131, I-765.",
        example: "I-485 / I-131 / I-765",
        type: "text",
        section: "Part 3: Applications",
        placeholder: "e.g. I-485, I-765",
      },
    ],
  },

  // Signature field in Part 3 (applicant's signature line at bottom of table)
  {
    key: "pt3_lL2a_ApplicantsSignature",
    pdfKey: "pt3_ll2a_applicantssignature",
    label: "Applicant's signature (Part 3 certification)",
    help: "This is the signature line at the bottom of the applications table.",
    type: "text",
    section: "Part 3: Applications",
    placeholder: "Full legal name as signature",
  },

  // Row 2
  {
    key: "pt3_has2",
    pdfKey: "",
    label: "Is there a second person to add to the table?",
    type: "radio",
    section: "Part 3: Applications",
    options: [
      { value: "Yes", label: "Yes" },
      { value: "No", label: "No" },
    ],
  },
  {
    key: "pt3_l1_Name2",
    pdfKey: "pt3_l1_name2",
    label: "Person #2, full name",
    type: "text",
    section: "Part 3: Applications",
    placeholder: "Full name",
    condition: (data) => data.pt3_has2 === "Yes",
    subQuestions: [
      {
        key: "pt3_l1_AlienNumber2",
        pdfKey: "pt3_l1_aliennumber2",
        label: "A-Number (if any)",
        type: "text",
        section: "Part 3: Applications",
        placeholder: "8 or 9 digits",
        skip: "No A-Number",
        tooltip:
          "An A-Number (Alien Registration Number) is a 7 to 9 digit number USCIS gives to non-citizens. You can find it on a green card, work permit, or immigration notices. Leave blank if there is none.",
        validate: (v) => (!v || /^\d{8,9}$/.test(v) ? null : "8 or 9 digits"),
      },
      {
        key: "pt3_l1_DateofBirth2",
        pdfKey: "pt3_l1_dateofbirth2",
        label: "Date of birth",
        type: "date",
        section: "Part 3: Applications",
        placeholder: "MM/DD/YYYY",
      },
      {
        key: "pt3_l1_FormsFiled2",
        pdfKey: "pt3_l1_formsfiled2",
        label: "Form(s) being filed",
        type: "text",
        section: "Part 3: Applications",
        placeholder: "e.g. I-485, I-765",
      },
    ],
  },

  // Row 3
  {
    key: "pt3_has3",
    pdfKey: "",
    label: "Is there a third person?",
    type: "radio",
    section: "Part 3: Applications",
    condition: (data) => data.pt3_has2 === "Yes",
    options: [
      { value: "Yes", label: "Yes" },
      { value: "No", label: "No" },
    ],
  },
  {
    key: "pt3_l1_Name3",
    pdfKey: "pt3_l1_name3",
    label: "Person #3, full name",
    type: "text",
    section: "Part 3: Applications",
    placeholder: "Full name",
    condition: (data) => data.pt3_has3 === "Yes",
    subQuestions: [
      {
        key: "pt3_l1_AlienNumber3",
        pdfKey: "pt3_l1_aliennumber3",
        label: "A-Number (if any)",
        type: "text",
        section: "Part 3: Applications",
        placeholder: "8 or 9 digits",
        skip: "No A-Number",
        tooltip:
          "An A-Number (Alien Registration Number) is a 7 to 9 digit number USCIS gives to non-citizens. You can find it on a green card, work permit, or immigration notices. Leave blank if there is none.",
        validate: (v) => (!v || /^\d{8,9}$/.test(v) ? null : "8 or 9 digits"),
      },
      {
        key: "pt3_l1_DateofBirth3",
        pdfKey: "pt3_l1_dateofbirth3",
        label: "Date of birth",
        type: "date",
        section: "Part 3: Applications",
        placeholder: "MM/DD/YYYY",
      },
      {
        key: "pt3_l1_FormsFiled3",
        pdfKey: "pt3_l1_formsfiled3",
        label: "Form(s) being filed",
        type: "text",
        section: "Part 3: Applications",
        placeholder: "e.g. I-485, I-765",
      },
    ],
  },

  // Row 4
  {
    key: "pt3_has4",
    pdfKey: "",
    label: "Is there a fourth person?",
    type: "radio",
    section: "Part 3: Applications",
    condition: (data) => data.pt3_has3 === "Yes",
    options: [
      { value: "Yes", label: "Yes" },
      { value: "No", label: "No" },
    ],
  },
  {
    key: "pt3_l1_Name4",
    pdfKey: "pt3_l1_name4",
    label: "Person #4, full name",
    type: "text",
    section: "Part 3: Applications",
    placeholder: "Full name",
    condition: (data) => data.pt3_has4 === "Yes",
    subQuestions: [
      {
        key: "pt3_l1_AlienNumber4",
        pdfKey: "pt3_l1_aliennumber4",
        label: "A-Number (if any)",
        type: "text",
        section: "Part 3: Applications",
        placeholder: "8 or 9 digits",
        skip: "No A-Number",
        tooltip:
          "An A-Number (Alien Registration Number) is a 7 to 9 digit number USCIS gives to non-citizens. You can find it on a green card, work permit, or immigration notices. Leave blank if there is none.",
        validate: (v) => (!v || /^\d{8,9}$/.test(v) ? null : "8 or 9 digits"),
      },
      {
        key: "pt3_l1_DateofBirth4",
        pdfKey: "pt3_l1_dateofbirth4",
        label: "Date of birth",
        type: "date",
        section: "Part 3: Applications",
        placeholder: "MM/DD/YYYY",
      },
      {
        key: "pt3_l1_FormsFiled4",
        pdfKey: "pt3_l1_formsfiled4",
        label: "Form(s) being filed",
        type: "text",
        section: "Part 3: Applications",
        placeholder: "e.g. I-485, I-765",
      },
    ],
  },

  // Total number of forms
  {
    key: "pt3_l1_TotalForms",
    pdfKey: "pt3_l1_totalforms",
    label: "Total number of forms being filed (including yourself)?",
    hint: "Add up all the rows above, count each form separately.",
    example: "If you're filing 2 forms for yourself and 1 for your child, the total is 3.",
    type: "text",
    section: "Part 3: Applications",
    placeholder: "e.g. 3",
    validate: (v) => (/^\d+$/.test(v) ? null : "Number only"),
  },

  // Other field (Part 3)
  {
    key: "pt3_l3_Other",
    pdfKey: "pt3_l3_other",
    label: "Anything else to note about these applications? (optional)",
    type: "text",
    section: "Part 3: Applications",
    placeholder: "Additional notes",
    skip: "Nothing to add",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PART 4 — MEANS-TESTED BENEFITS
  // Only shown if Basis A was selected
  // ══════════════════════════════════════════════════════════════════════════

  // Benefits table — Row 1
  {
    key: "pt4_l1_FullName1",
    pdfKey: "pt4_l1_fullname1",
    label: "Person #1 receiving a benefit, full name?",
    hint: "This can be you, your spouse, or the head of your household (including a parent if the child is under 21). List anyone who is receiving a qualifying government benefit.",
    type: "text",
    section: "Part 4: Benefits",
    placeholder: "Full name",
    condition: (data) => !!data.pt1_l1_Checkbox,
    subQuestions: [
      {
        key: "pt4_l1_Relationship1",
        pdfKey: "pt4_l1_relationship1",
        label: "Their relationship to you?",
        example: "Self / Spouse / Child / Parent / Head of Household",
        type: "text",
        section: "Part 4: Benefits",
        placeholder: "e.g. Self / Spouse / Child",
      },
      {
        key: "pt4_l1_Agency1",
        pdfKey: "pt4_l1_agency1",
        label: "Name of the agency that gave them the benefit?",
        example: "State Medicaid Office / Social Security Administration / State DHS",
        type: "text",
        section: "Part 4: Benefits",
        placeholder: "Agency name",
      },
      {
        key: "pt4_l1_TypeofBene1",
        pdfKey: "pt4_l1_typeofbene1",
        label: "What type of benefit do they receive?",
        example: "Medicaid / SNAP / SSI / TANF / CHIP",
        type: "text",
        section: "Part 4: Benefits",
        placeholder: "e.g. Medicaid / SNAP / SSI",
        tooltip:
          "A means-tested benefit is government help given because of low income, such as Medicaid, SNAP (food stamps), SSI, or TANF. It does not include benefits like Social Security retirement or unemployment.",
      },
      {
        key: "pt4_l1_DateAward1",
        pdfKey: "pt4_l1_dateaward1",
        label: "When was the benefit first awarded?",
        find: "Your benefit award letter or notice from the agency.",
        type: "date",
        section: "Part 4: Benefits",
        placeholder: "MM/DD/YYYY",
      },
      {
        key: "pt4_l1_ExpDate1",
        pdfKey: "pt4_l1_expdate1",
        label: "When does this benefit expire (or need to be renewed)?",
        find: "Your benefit card, letter, or the agency's online portal.",
        type: "date",
        section: "Part 4: Benefits",
        placeholder: "MM/DD/YYYY",
        skip: "No expiration date / ongoing",
      },
    ],
  },

  {
    key: "pt4_has2",
    pdfKey: "",
    label: "Is there a second person in your household also receiving a benefit?",
    type: "radio",
    section: "Part 4: Benefits",
    condition: (data) => !!data.pt1_l1_Checkbox,
    options: [
      { value: "Yes", label: "Yes" },
      { value: "No", label: "No" },
    ],
  },

  // Benefits table — Row 2
  {
    key: "pt4_l1_FullName2",
    pdfKey: "pt4_l1_fullname2",
    label: "Person #2, full name?",
    type: "text",
    section: "Part 4: Benefits",
    placeholder: "Full name",
    condition: (data) => data.pt4_has2 === "Yes",
    subQuestions: [
      {
        key: "pt4_l1_Relationship2",
        pdfKey: "pt4_l1_relationship2",
        label: "Their relationship to you?",
        type: "text",
        section: "Part 4: Benefits",
        placeholder: "e.g. Spouse / Child / Parent",
      },
      {
        key: "pt4_l1_Agency2",
        pdfKey: "pt4_l1_agency2",
        label: "Awarding agency?",
        type: "text",
        section: "Part 4: Benefits",
        placeholder: "Agency name",
      },
      {
        key: "pt4_l1_TypeofBene2",
        pdfKey: "pt4_l1_typeofbene2",
        label: "Type of benefit?",
        type: "text",
        section: "Part 4: Benefits",
        placeholder: "e.g. Medicaid / SNAP",
        tooltip:
          "A means-tested benefit is government help given because of low income, such as Medicaid, SNAP (food stamps), SSI, or TANF. It does not include benefits like Social Security retirement or unemployment.",
      },
      {
        key: "pt4_l1_DateAward2",
        pdfKey: "pt4_l1_dateaward2",
        label: "Date benefit was awarded?",
        type: "date",
        section: "Part 4: Benefits",
        placeholder: "MM/DD/YYYY",
      },
      {
        key: "pt4_l1_ExpDate2",
        pdfKey: "pt4_l1_expdate2",
        label: "Expiration date?",
        type: "date",
        section: "Part 4: Benefits",
        placeholder: "MM/DD/YYYY",
        skip: "No expiration date",
      },
    ],
  },

  {
    key: "pt4_has3",
    pdfKey: "",
    label: "Is there a third person?",
    type: "radio",
    section: "Part 4: Benefits",
    condition: (data) => data.pt4_has2 === "Yes",
    options: [
      { value: "Yes", label: "Yes" },
      { value: "No", label: "No" },
    ],
  },

  // Benefits table — Row 3
  {
    key: "pt4_l1_FullName3",
    pdfKey: "pt4_l1_fullname3",
    label: "Person #3, full name?",
    type: "text",
    section: "Part 4: Benefits",
    placeholder: "Full name",
    condition: (data) => data.pt4_has3 === "Yes",
    subQuestions: [
      {
        key: "pt4_l1_Relationship3",
        pdfKey: "pt4_l1_relationship3",
        label: "Their relationship to you?",
        type: "text",
        section: "Part 4: Benefits",
        placeholder: "e.g. Spouse / Child / Parent",
      },
      {
        key: "pt4_l1_Agency3",
        pdfKey: "pt4_l1_agency3",
        label: "Awarding agency?",
        type: "text",
        section: "Part 4: Benefits",
        placeholder: "Agency name",
      },
      {
        key: "pt4_l1_TypeofBene3",
        pdfKey: "pt4_l1_typeofbene3",
        label: "Type of benefit?",
        type: "text",
        section: "Part 4: Benefits",
        placeholder: "e.g. Medicaid / SNAP",
        tooltip:
          "A means-tested benefit is government help given because of low income, such as Medicaid, SNAP (food stamps), SSI, or TANF. It does not include benefits like Social Security retirement or unemployment.",
      },
      {
        key: "pt4_l1_DateAward3",
        pdfKey: "pt4_l1_dateaward3",
        label: "Date benefit was awarded?",
        type: "date",
        section: "Part 4: Benefits",
        placeholder: "MM/DD/YYYY",
      },
      {
        key: "pt4_l1_ExpDate3",
        pdfKey: "pt4_l1_expdate3",
        label: "Expiration date?",
        type: "date",
        section: "Part 4: Benefits",
        placeholder: "MM/DD/YYYY",
        skip: "No expiration date",
      },
    ],
  },

  {
    key: "pt4_has4",
    pdfKey: "",
    label: "Is there a fourth person?",
    type: "radio",
    section: "Part 4: Benefits",
    condition: (data) => data.pt4_has3 === "Yes",
    options: [
      { value: "Yes", label: "Yes" },
      { value: "No", label: "No" },
    ],
  },

  // Benefits table — Row 4
  {
    key: "pt4_l1_FullName4",
    pdfKey: "pt4_l1_fullname4",
    label: "Person #4, full name?",
    type: "text",
    section: "Part 4: Benefits",
    placeholder: "Full name",
    condition: (data) => data.pt4_has4 === "Yes",
    subQuestions: [
      {
        key: "pt4_l1_Relationship4",
        pdfKey: "pt4_l1_relationship4",
        label: "Their relationship to you?",
        type: "text",
        section: "Part 4: Benefits",
        placeholder: "e.g. Spouse / Child / Parent",
      },
      {
        key: "pt4_l1_Agency4",
        pdfKey: "pt4_l1_agency4",
        label: "Awarding agency?",
        type: "text",
        section: "Part 4: Benefits",
        placeholder: "Agency name",
      },
      {
        key: "pt4_l1_TypeofBene4",
        pdfKey: "pt4_l1_typeofbene4",
        label: "Type of benefit?",
        type: "text",
        section: "Part 4: Benefits",
        placeholder: "e.g. Medicaid / SNAP",
        tooltip:
          "A means-tested benefit is government help given because of low income, such as Medicaid, SNAP (food stamps), SSI, or TANF. It does not include benefits like Social Security retirement or unemployment.",
      },
      {
        key: "pt4_l1_DateAward4",
        pdfKey: "pt4_l1_dateaward4",
        label: "Date benefit was awarded?",
        type: "date",
        section: "Part 4: Benefits",
        placeholder: "MM/DD/YYYY",
      },
      {
        key: "pt4_l1_ExpDate4",
        pdfKey: "pt4_l1_expdate4",
        label: "Expiration date?",
        type: "date",
        section: "Part 4: Benefits",
        placeholder: "MM/DD/YYYY",
        skip: "No expiration date",
      },
    ],
  },

  // Second set of benefit rows (_1 variants — the form has a second page of the table)
  {
    key: "pt4_hasPage2",
    pdfKey: "",
    label: "Do you need to list more benefit recipients on a second page of the table?",
    type: "radio",
    section: "Part 4: Benefits",
    options: [
      { value: "Yes", label: "Yes, I have more to add" },
      { value: "No", label: "No, that covers everyone" },
    ],
  },
  {
    key: "pt4_l1_FullName1_1",
    pdfKey: "pt4_l1_fullname1_1",
    label: "Continued, Person #5, full name?",
    type: "text",
    section: "Part 4: Benefits",
    placeholder: "Full name",
    condition: (data) => data.pt4_hasPage2 === "Yes",
    subQuestions: [
      {
        key: "pt4_l1_Relationship1_1",
        pdfKey: "pt4_l1_relationship1_1",
        label: "Relationship to you?",
        type: "text",
        section: "Part 4: Benefits",
        placeholder: "e.g. Spouse / Child",
      },
      {
        key: "pt4_l1_Agency1_1",
        pdfKey: "pt4_l1_agency1_1",
        label: "Awarding agency?",
        type: "text",
        section: "Part 4: Benefits",
        placeholder: "Agency name",
      },
      {
        key: "pt4_l1_TypeofBene1_1",
        pdfKey: "pt4_l1_typeofbene1_1",
        label: "Type of benefit?",
        type: "text",
        section: "Part 4: Benefits",
        placeholder: "e.g. Medicaid / SNAP",
        tooltip:
          "A means-tested benefit is government help given because of low income, such as Medicaid, SNAP (food stamps), SSI, or TANF. It does not include benefits like Social Security retirement or unemployment.",
      },
      {
        key: "pt4_l1_DateAward1_1",
        pdfKey: "pt4_l1_dateaward1_1",
        label: "Date awarded?",
        type: "date",
        section: "Part 4: Benefits",
        placeholder: "MM/DD/YYYY",
      },
      {
        key: "pt4_l1_ExpDate1_1",
        pdfKey: "pt4_l1_expdate1_1",
        label: "Expiration date?",
        type: "date",
        section: "Part 4: Benefits",
        placeholder: "MM/DD/YYYY",
        skip: "No expiration date",
      },
    ],
  },
  {
    key: "pt4_l1_FullName2_1",
    pdfKey: "pt4_l1_fullname2_1",
    label: "Person #6, full name?",
    type: "text",
    section: "Part 4: Benefits",
    placeholder: "Full name",
    condition: (data) => data.pt4_hasPage2 === "Yes",
    subQuestions: [
      {
        key: "pt4_l1_Relationship2_1",
        pdfKey: "pt4_l1_relationship2_1",
        label: "Relationship to you?",
        type: "text",
        section: "Part 4: Benefits",
        placeholder: "e.g. Spouse / Child",
      },
      {
        key: "pt4_l1_Agency2_1",
        pdfKey: "pt4_l1_agency2_1",
        label: "Awarding agency?",
        type: "text",
        section: "Part 4: Benefits",
        placeholder: "Agency name",
      },
      {
        key: "pt4_l1_TypeofBene2_1",
        pdfKey: "pt4_l1_typeofbene2_1",
        label: "Type of benefit?",
        type: "text",
        section: "Part 4: Benefits",
        placeholder: "e.g. Medicaid / SNAP",
        tooltip:
          "A means-tested benefit is government help given because of low income, such as Medicaid, SNAP (food stamps), SSI, or TANF. It does not include benefits like Social Security retirement or unemployment.",
      },
      {
        key: "pt4_l1_DateAward2_1",
        pdfKey: "pt4_l1_dateaward2_1",
        label: "Date awarded?",
        type: "date",
        section: "Part 4: Benefits",
        placeholder: "MM/DD/YYYY",
      },
      {
        key: "pt4_l1_ExpDate2_1",
        pdfKey: "pt4_l1_expdate2_1",
        label: "Expiration date?",
        type: "date",
        section: "Part 4: Benefits",
        placeholder: "MM/DD/YYYY",
        skip: "No expiration date",
      },
    ],
  },
  {
    key: "pt4_l1_FullName3_1",
    pdfKey: "pt4_l1_fullname3_1",
    label: "Person #7, full name?",
    type: "text",
    section: "Part 4: Benefits",
    placeholder: "Full name",
    condition: (data) => data.pt4_hasPage2 === "Yes",
    subQuestions: [
      {
        key: "pt4_l1_Relationship3_1",
        pdfKey: "pt4_l1_relationship3_1",
        label: "Relationship to you?",
        type: "text",
        section: "Part 4: Benefits",
        placeholder: "e.g. Spouse / Child",
      },
      {
        key: "pt4_l1_Agency3_1",
        pdfKey: "pt4_l1_agency3_1",
        label: "Awarding agency?",
        type: "text",
        section: "Part 4: Benefits",
        placeholder: "Agency name",
      },
      {
        key: "pt4_l1_TypeofBene3_1",
        pdfKey: "pt4_l1_typeofbene3_1",
        label: "Type of benefit?",
        type: "text",
        section: "Part 4: Benefits",
        placeholder: "e.g. Medicaid / SNAP",
        tooltip:
          "A means-tested benefit is government help given because of low income, such as Medicaid, SNAP (food stamps), SSI, or TANF. It does not include benefits like Social Security retirement or unemployment.",
      },
      {
        key: "pt4_l1_DateAward3_1",
        pdfKey: "pt4_l1_dateaward3_1",
        label: "Date awarded?",
        type: "date",
        section: "Part 4: Benefits",
        placeholder: "MM/DD/YYYY",
      },
      {
        key: "pt4_l1_ExpDate3_1",
        pdfKey: "pt4_l1_expdate3_1",
        label: "Expiration date?",
        type: "date",
        section: "Part 4: Benefits",
        placeholder: "MM/DD/YYYY",
        skip: "No expiration date",
      },
    ],
  },
  {
    key: "pt4_l1_FullName4_1",
    pdfKey: "pt4_l1_fullname4_1",
    label: "Person #8, full name?",
    type: "text",
    section: "Part 4: Benefits",
    placeholder: "Full name",
    condition: (data) => data.pt4_hasPage2 === "Yes",
    subQuestions: [
      {
        key: "pt4_l1_Relationship4_1",
        pdfKey: "pt4_l1_relationship4_1",
        label: "Relationship to you?",
        type: "text",
        section: "Part 4: Benefits",
        placeholder: "e.g. Spouse / Child",
      },
      {
        key: "pt4_l1_Agency4_1",
        pdfKey: "pt4_l1_agency4_1",
        label: "Awarding agency?",
        type: "text",
        section: "Part 4: Benefits",
        placeholder: "Agency name",
      },
      {
        key: "pt4_l1_TypeofBene4_1",
        pdfKey: "pt4_l1_typeofbene4_1",
        label: "Type of benefit?",
        type: "text",
        section: "Part 4: Benefits",
        placeholder: "e.g. Medicaid / SNAP",
        tooltip:
          "A means-tested benefit is government help given because of low income, such as Medicaid, SNAP (food stamps), SSI, or TANF. It does not include benefits like Social Security retirement or unemployment.",
      },
      {
        key: "pt4_l1_DateAward4_1",
        pdfKey: "pt4_l1_dateaward4_1",
        label: "Date awarded?",
        type: "date",
        section: "Part 4: Benefits",
        placeholder: "MM/DD/YYYY",
      },
      {
        key: "pt4_l1_ExpDate4_1",
        pdfKey: "pt4_l1_expdate4_1",
        label: "Expiration date?",
        type: "date",
        section: "Part 4: Benefits",
        placeholder: "MM/DD/YYYY",
        skip: "No expiration date",
      },
    ],
  },

  // Additional people listed in Part 4 (dates of birth fields pt4_l2a–d)
  {
    key: "pt4_l2a_RelationshipToYou1",
    pdfKey: "pt4_l2a_relationshiptoyou1",
    label: "Relationship to you (for continuation row 1)?",
    hint: "This matches the relationship column for any additional rows on the continuation page.",
    type: "text",
    section: "Part 4: Benefits",
    placeholder: "e.g. Spouse / Child",
    condition: (data) => data.pt4_hasPage2 === "Yes",
  },
  {
    key: "pt4_l2b_DateofBirth2",
    pdfKey: "pt4_l2b_dateofbirth2",
    label: "Date of birth for continuation row 2?",
    type: "date",
    section: "Part 4: Benefits",
    placeholder: "MM/DD/YYYY",
    condition: (data) => data.pt4_hasPage2 === "Yes",
  },
  {
    key: "pt4_l2c_DateofBirth3",
    pdfKey: "pt4_l2c_dateofbirth3",
    label: "Date of birth for continuation row 3?",
    type: "date",
    section: "Part 4: Benefits",
    placeholder: "MM/DD/YYYY",
    condition: (data) => data.pt4_hasPage2 === "Yes",
  },
  {
    key: "pt4_l2d_DateofBirth4",
    pdfKey: "pt4_l2d_dateofbirth4",
    label: "Date of birth for continuation row 4?",
    type: "date",
    section: "Part 4: Benefits",
    placeholder: "MM/DD/YYYY",
    condition: (data) => data.pt4_hasPage2 === "Yes",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PART 5 — INCOME AT OR BELOW 150% FEDERAL POVERTY GUIDELINES
  // Only shown if Basis B was selected
  // ══════════════════════════════════════════════════════════════════════════

  // Item 1 — Employment status
  {
    key: "pt5_l1_EmploymentStatus",
    pdfKey: "pt5_l1_employmentstatus",
    label: "What's your current work situation?",
    hint: "Pick the one that best describes you right now.",
    type: "radio",
    section: "Part 5: Income",
    condition: (data) => !!data.pt1_l1_Checkbox_1,
    options: [
      {
        value: "employed",
        label: "I have a job (full-time, part-time, seasonal, or self-employed)",
      },
      { value: "unemployed", label: "I'm not working right now" },
      { value: "retired", label: "I'm retired" },
      { value: "other", label: "Other" },
    ],
    subQuestions: [
      {
        key: "pt5_l1_EmploymentStatus_1",
        pdfKey: "pt5_l1_employmentstatus_1",
        label: "Employed (full-time, part-time, seasonal, self-employed)",
        type: "checkbox",
        section: "Part 5: Income",
      },
      {
        key: "pt5_l1_EmploymentStatus_2",
        pdfKey: "pt5_l1_employmentstatus_2",
        label: "Unemployed or Not Employed",
        type: "checkbox",
        section: "Part 5: Income",
      },
      {
        key: "pt5_l1_EmploymentStatus_3",
        pdfKey: "pt5_l1_employmentstatus_3",
        label: "Retired",
        type: "checkbox",
        section: "Part 5: Income",
      },
    ],
  },

  // Item 2 — Unemployment benefits
  {
    key: "pt5_l2_chbxyesno",
    pdfKey: "pt5_l2_chbxyesno",
    label: "Are you currently receiving unemployment benefits?",
    hint: 'Only answer this if you selected "not working" above.',
    type: "radio",
    section: "Part 5: Income",
    condition: (data) => data.pt5_l1_EmploymentStatus === "unemployed",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
    subQuestions: [
      {
        key: "pt5_l2_chbxyesno_1",
        pdfKey: "pt5_l2_chbxyesno_1",
        label: "Unemployment benefits, No",
        type: "checkbox",
        section: "Part 5: Income",
      },
      {
        key: "pt5_l2a_DateOfUnemployment",
        pdfKey: "pt5_l2a_dateofunemployment",
        label: "When did you become unemployed?",
        help: "The date your last job ended.",
        type: "date",
        section: "Part 5: Income",
        placeholder: "MM/DD/YYYY",
        condition: (data) => data.pt5_l1_EmploymentStatus === "unemployed",
      },
    ],
  },

  // Item 3 — Household size
  {
    key: "pt5_l3_TotalHouseSize",
    pdfKey: "pt5_l3_totalhousesize",
    label: "How many people live in your household?",
    hint: "Count everyone you support and live with, yourself, your spouse, your children, and anyone else who lives with you and depends on your income. Do not count roommates who pay their own way.",
    example: "You + spouse + 2 kids = 4",
    type: "text",
    section: "Part 5: Income",
    placeholder: "Number of people",
    validate: (v) => (/^\d+$/.test(v) ? null : "Number only"),
  },

  // Item 4 — Number earning income
  {
    key: "pt5_l4_TotalHousehold",
    pdfKey: "pt5_l4_totalhousehold",
    label: "How many people in your household earn income (including yourself)?",
    hint: "Count anyone who earns wages, self-employment income, pension, or other regular income.",
    example: "If just you earn income, enter 1.",
    type: "text",
    section: "Part 5: Income",
    placeholder: "Number of income earners",
    validate: (v) => (/^\d+$/.test(v) ? null : "Number only"),
  },

  // Item 5 — Head of household name
  {
    key: "pt5_l5_NameHousehold",
    pdfKey: "pt5_l5_namehousehold",
    label: "If you are not the head of household, who is?",
    hint: "Leave blank if you are the head of household. Otherwise, write the name of the person who is (usually the main earner or the person the household is counted under).",
    type: "text",
    section: "Part 5: Income",
    placeholder: "Head of household's full name",
    skip: "I am the head of household",
  },

  // Item 6 — Your annual adjusted gross income
  {
    key: "pt5_yourIncome",
    pdfKey: "pt5_l6_yourincome",
    label: "What is your own annual adjusted gross income?",
    help: "Your Adjusted Gross Income (AGI) is your total earnings before taxes, minus certain deductions like student loan interest or IRA contributions. Look at Line 11 on your most recent Form 1040.",
    find: 'Form 1040, Line 11, labeled "Adjusted Gross Income" about one-third of the way down.',
    example: "If Line 11 shows $22,000, type: 22000",
    type: "text",
    section: "Part 5: Income",
    placeholder: "Dollar amount, numbers only",
    isIncomeField: true,
    validate: (v) => (/^\d+(\.\d{1,2})?$/.test(v) ? null : "Numbers only, like 22000"),
  },

  // Item 7 — Income of all other family members
  {
    key: "pt5_familyIncome",
    pdfKey: "pt5_l7_familyincome",
    label: "What is the combined annual adjusted gross income of all other household members?",
    hint: "Add up everyone else's income in your household. Do not include your own, that was the previous question. If no one else earns income, enter 0.",
    example: "Spouse earns $15,000, enter: 15000",
    type: "text",
    section: "Part 5: Income",
    placeholder: "Dollar amount, numbers only",
    isIncomeField: true,
    validate: (v) => (/^\d+(\.\d{1,2})?$/.test(v) ? null : "Numbers only, enter 0 if none"),
  },

  // Item 8 — Total household income
  {
    key: "pt5_totalIncome",
    pdfKey: "pt5_l8_totalincome",
    label: "Total adjusted gross household income (your income + all other members)?",
    hint: "Add the two amounts from the last two questions together.",
    example: "Your $22,000 + spouse $15,000 = $37,000, enter: 37000",
    type: "text",
    section: "Part 5: Income",
    placeholder: "Total household income",
    isIncomeField: true,
    validate: (v) => (/^\d+(\.\d{1,2})?$/.test(v) ? null : "Numbers only"),
  },

  // Item 9 — Changes since tax return
  {
    key: "pt5_l9_checkbox",
    pdfKey: "pt5_l9_checkbox",
    label: "Has anything changed in your life since you last filed your federal tax return?",
    hint: "For example: your marital status changed, you had or lost a job, your income went up or down, or your number of dependents changed.",
    type: "radio",
    section: "Part 5: Income",
    options: [
      { value: "yes", label: "Yes, something has changed", sublabel: "You'll explain below." },
      { value: "no", label: "No, my situation is the same as my tax return" },
    ],
    subQuestions: [
      {
        key: "pt5_l9_checkbox_1",
        pdfKey: "pt5_l9_checkbox_1",
        label: "No changes since tax return",
        type: "checkbox",
        section: "Part 5: Income",
      },
      {
        key: "pt5_l9_Explanation",
        pdfKey: "pt5_l9_explanation",
        label: "Explain what changed?",
        hint: "Be as specific as you can, include dates and amounts if possible. You can also attach documents.",
        example: "Lost my job in March 2024, income dropped from $45,000 to $12,000 this year.",
        type: "text",
        section: "Part 5: Income",
        placeholder: "Describe what changed and when",
        condition: (data) => data.pt5_l9_checkbox === "yes",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PART 6 — FINANCIAL HARDSHIP
  // Only shown if Basis C was selected
  // ══════════════════════════════════════════════════════════════════════════

  // Item 1 — Describe the hardship
  {
    key: "pt6_l1_Situation",
    pdfKey: "pt6_l1_situation",
    label: "Describe your financial hardship situation.",
    hint: "Explain what happened and how it has made it difficult to pay the filing fee. Be specific, include amounts, dates, and names of family members affected when possible.",
    help: "Examples USCIS considers valid hardships: major medical debt or illness for yourself or a family member; recent job loss; homelessness or housing instability; natural disaster (check the FEMA declarations list); domestic violence; disability-related expenses.",
    example:
      "My spouse was diagnosed with cancer in January 2024. Medical bills total $28,000 and our income dropped by half when she had to stop working.",
    type: "text",
    section: "Part 6: Hardship",
    placeholder: "Describe your situation in as much detail as possible",
    condition: (data) => !!data.pt1_l2_Checkbox,
  },

  // Item 2 — Assets table
  {
    key: "pt7_l2a_TypeOfAsset",
    pdfKey: "pt7_l2a_typeofasset",
    label: "Do you have any cash or assets you could quickly convert to cash?",
    hint: "List savings accounts, stocks, bonds, etc. Do not include retirement accounts (like a 401k or IRA), those don't count here.",
    help: "Only list things you can actually access now. If the balance is very low (under a few hundred dollars), you can still list it.",
    example: "Savings account: $350 / Checking account: $120",
    type: "text",
    section: "Part 6: Hardship",
    placeholder: "Type of asset (e.g. Savings account)",
    skip: "I have no significant cash or assets",
    condition: (data) => !!data.pt1_l2_Checkbox,
    subQuestions: [
      {
        key: "pt7_l2b_TypeOfAsset",
        pdfKey: "pt7_l2b_typeofasset",
        label: "Value of this asset (in U.S. dollars)?",
        type: "text",
        section: "Part 6: Hardship",
        placeholder: "Dollar amount",
        isAssetField: true,
        validate: (v) => (!v || /^\d+(\.\d{1,2})?$/.test(v) ? null : "Numbers only"),
      },
    ],
  },
  {
    key: "pt7_hasAsset2",
    pdfKey: "",
    label: "Any other assets to list?",
    type: "radio",
    section: "Part 6: Hardship",
    condition: (data) => !!data.pt1_l2_Checkbox,
    options: [
      { value: "Yes", label: "Yes" },
      { value: "No", label: "No" },
    ],
  },
  {
    key: "pt7_l2c_TypeOfAsset",
    pdfKey: "pt7_l2c_typeofasset",
    label: "Second asset, type?",
    type: "text",
    section: "Part 6: Hardship",
    placeholder: "e.g. Checking account / Stocks",
    condition: (data) => data.pt7_hasAsset2 === "Yes",
    subQuestions: [
      {
        key: "pt7_asset2Value",
        pdfKey: "pt7_l2c_typeofasset_value",
        label: "Value of this asset?",
        type: "text",
        section: "Part 6: Hardship",
        placeholder: "Dollar amount",
        validate: (v) => (!v || /^\d+(\.\d{1,2})?$/.test(v) ? null : "Numbers only"),
      },
    ],
  },

  // Item 3 — Monthly expenses
  {
    key: "pt6_l3_Checkbox",
    pdfKey: "pt6_l3_checkbox",
    label: "Rent and/or mortgage payment each month?",
    hint: "Check this box and enter the amount if this applies to you.",
    type: "checkbox",
    section: "Part 6: Hardship",
    condition: (data) => !!data.pt1_l2_Checkbox,
  },
  {
    key: "pt6_l3_Checkbox_1",
    pdfKey: "pt6_l3_checkbox_1",
    label: "Food expenses each month?",
    type: "checkbox",
    section: "Part 6: Hardship",
    condition: (data) => !!data.pt1_l2_Checkbox,
  },
  {
    key: "pt6_l3_Checkbox_2",
    pdfKey: "pt6_l3_checkbox_2",
    label: "Utilities (electricity, gas, water, phone) each month?",
    type: "checkbox",
    section: "Part 6: Hardship",
    condition: (data) => !!data.pt1_l2_Checkbox,
  },
  {
    key: "pt6_l3_Checkbox_3",
    pdfKey: "pt6_l3_checkbox_3",
    label: "Child care and/or elder care costs each month?",
    type: "checkbox",
    section: "Part 6: Hardship",
    condition: (data) => !!data.pt1_l2_Checkbox,
  },
  {
    key: "pt6_l3_Checkbox_4",
    pdfKey: "pt6_l3_checkbox_4",
    label: "Insurance premiums each month? (health, car, home, etc.)",
    type: "checkbox",
    section: "Part 6: Hardship",
    condition: (data) => !!data.pt1_l2_Checkbox,
  },
  {
    key: "pt6_l3_Checkbox_5",
    pdfKey: "pt6_l3_checkbox_5",
    label: "Loan and/or credit card payments each month?",
    type: "checkbox",
    section: "Part 6: Hardship",
    condition: (data) => !!data.pt1_l2_Checkbox,
  },
  {
    key: "pt6_l3_Checkbox_6",
    pdfKey: "pt6_l3_checkbox_6",
    label: "Car payment each month?",
    type: "checkbox",
    section: "Part 6: Hardship",
    condition: (data) => !!data.pt1_l2_Checkbox,
  },
  {
    key: "pt6_l3_Checkbox_7",
    pdfKey: "pt6_l3_checkbox_7",
    label: "Commuting costs (gas, bus, train) each month?",
    type: "checkbox",
    section: "Part 6: Hardship",
    condition: (data) => !!data.pt1_l2_Checkbox,
  },
  {
    key: "pt6_l3_Checkbox_8",
    pdfKey: "pt6_l3_checkbox_8",
    label: "Medical expenses each month?",
    type: "checkbox",
    section: "Part 6: Hardship",
    condition: (data) => !!data.pt1_l2_Checkbox,
  },
  {
    key: "pt6_l3_Checkbox_9",
    pdfKey: "pt6_l3_checkbox_9",
    label: "School or education expenses each month?",
    type: "checkbox",
    section: "Part 6: Hardship",
    condition: (data) => !!data.pt1_l2_Checkbox,
  },
  {
    key: "pt6_l3_Checkbox_10",
    pdfKey: "pt6_l3_checkbox_10",
    label: "Other expenses not listed above?",
    type: "checkbox",
    section: "Part 6: Hardship",
    condition: (data) => !!data.pt1_l2_Checkbox,
    subQuestions: [
      {
        key: "pt6_l3_Other",
        pdfKey: "pt6_l3_other",
        label: "Describe these other expenses.",
        type: "text",
        section: "Part 6: Hardship",
        placeholder: "e.g. Court-ordered child support, therapy copays",
        condition: (data) => !!data.pt6_l3_Checkbox_10,
      },
    ],
  },

  // Total monthly expenses
  {
    key: "pt6_l3_Total",
    pdfKey: "pt6_l3_total",
    label: "Total monthly expenses and liabilities (add everything above)?",
    hint: 'Add up all the checked expense categories. Type "0" if you have no monthly expenses.',
    example: "Rent $800 + Food $300 + Utilities $150 = $1,250, enter: 1250",
    type: "text",
    section: "Part 6: Hardship",
    placeholder: "Total in dollars, enter 0 if none",
    validate: (v) => (/^\d+(\.\d{1,2})?$/.test(v) ? null : "Numbers only, enter 0 if none"),
    condition: (data) => !!data.pt1_l2_Checkbox,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PART 7 — REQUESTOR STATEMENT, CONTACT INFORMATION, AND SIGNATURE
  // ══════════════════════════════════════════════════════════════════════════

  // Item 1 — Did you read it in English?
  {
    key: "pt7_l0_Check_box",
    pdfKey: "pt7_l0_check_box",
    label: "Did you read this form yourself in English?",
    type: "radio",
    section: "Part 7: Requestor Statement",
    options: [
      { value: "english", label: "Yes, I read it myself in English" },
      { value: "interpreter", label: "No, an interpreter read it to me in another language" },
    ],
    subQuestions: [
      {
        key: "pt7_l0_Check_box_1",
        pdfKey: "pt7_l0_check_box_1",
        label: "I can read and understand English",
        type: "checkbox",
        section: "Part 7: Requestor Statement",
      },
      {
        key: "pt7_l0_Check_box_2",
        pdfKey: "pt7_l0_check_box_2",
        label: "An interpreter read the form to me",
        type: "checkbox",
        section: "Part 7: Requestor Statement",
      },
    ],
  },

  // Item 2 — Preparer involvement
  {
    key: "pt7_l0_Check_box_3",
    pdfKey: "pt7_l0_check_box_3",
    label: "Did someone else fill out this form for you?",
    hint: "For example, a lawyer, paralegal, or helper who typed in your answers based on what you told them.",
    type: "radio",
    section: "Part 7: Requestor Statement",
    options: [
      {
        value: "yes",
        label: "Yes, a preparer helped me",
        sublabel: "You'll enter their details in Part 9.",
      },
      { value: "no", label: "No, I filled it out myself" },
    ],
    subQuestions: [
      {
        key: "pt7_l0_Check_box_4",
        pdfKey: "pt7_l0_check_box_4",
        label: "A preparer helped complete this request",
        type: "checkbox",
        section: "Part 7: Requestor Statement",
      },
      {
        key: "pt7_lL2_Name",
        pdfKey: "pt7_ll2_name",
        label: "Preparer's name (as it will appear in Part 9)?",
        type: "text",
        section: "Part 7: Requestor Statement",
        placeholder: "Preparer's full name",
        condition: (data) => data.pt7_l0_Check_box_3 === "yes",
      },
    ],
  },

  // Interpreter language for statement
  {
    key: "pt7_l0_Check_box_5",
    pdfKey: "pt7_l0_check_box_5",
    label: "What language was the form interpreted into for you?",
    hint: "The interpreter should also complete Part 8.",
    type: "text",
    section: "Part 7: Requestor Statement",
    placeholder: "e.g. Spanish / Urdu / Tagalog",
    condition: (data) => data.pt7_l0_Check_box === "interpreter",
  },

  // Interpreter name for statement
  {
    key: "pt7_lL1B_Name",
    pdfKey: "pt7_ll1b_name",
    label: "Interpreter's name (as it will appear in Part 8)?",
    type: "text",
    section: "Part 7: Requestor Statement",
    placeholder: "Interpreter's full name",
    condition: (data) => data.pt7_l0_Check_box === "interpreter",
  },

  // Check boxes for Part 7 interpreter statement
  {
    key: "pt7_lL1_chbx",
    pdfKey: "pt7_ll1_chbx",
    label: "Select A: I can read and understand English",
    type: "checkbox",
    section: "Part 7: Requestor Statement",
  },
  {
    key: "pt7_lL1_chbx_1",
    pdfKey: "pt7_ll1_chbx_1",
    label: "Select B: Interpreter read the form to me",
    type: "checkbox",
    section: "Part 7: Requestor Statement",
  },
  {
    key: "pt7_lL2_chbx",
    pdfKey: "pt7_ll2_chbx",
    label: "Check: A preparer prepared this request on my behalf",
    type: "checkbox",
    section: "Part 7: Requestor Statement",
  },

  // Contact info
  {
    key: "pt7_lL3_DaytimeTelePhoneNumber1",
    pdfKey: "pt7_ll3_daytimetelephonenumber1",
    label: "Your daytime phone number?",
    type: "text",
    section: "Part 7: Requestor Statement",
    placeholder: "e.g. (555) 000-0000",
    validate: (v) => (/^[0-9\-\+\(\) ]{7,15}$/.test(v) ? null : "Enter a valid phone number"),
  },
  {
    key: "pt7_lL4_MobileTelePhoneNumber1",
    pdfKey: "pt7_ll4_mobiletelephonenumber1",
    label: "Your mobile phone number? (if different)",
    type: "text",
    section: "Part 7: Requestor Statement",
    placeholder: "Mobile number",
    skip: "Same as above or not applicable",
    validate: (v) => (!v || /^[0-9\-\+\(\) ]{7,15}$/.test(v) ? null : "Enter a valid phone number"),
  },
  {
    key: "pt7_lL5_EmailAddress",
    pdfKey: "pt7_ll5_emailaddress",
    label: "Your email address? (if any)",
    type: "text",
    section: "Part 7: Requestor Statement",
    placeholder: "email@example.com",
    skip: "I don't have an email address",
    validate: (v) =>
      !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Enter a valid email address",
  },

  // Signature
  {
    key: "pt7_lL6_Date",
    pdfKey: "pt7_ll6_date",
    label: "Date of your signature?",
    hint: "By signing this form, you're certifying under penalty of perjury that everything you've written is true and complete.",
    type: "date",
    section: "Part 7: Requestor Statement",
    placeholder: "MM/DD/YYYY",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PART 8 — INTERPRETER INFORMATION
  // ══════════════════════════════════════════════════════════════════════════

  {
    key: "pt8_used",
    pdfKey: "",
    label: "Did anyone translate this form for you?",
    type: "radio",
    section: "Part 8: Interpreter",
    options: [
      { value: "Yes", label: "Yes, someone translated it for me" },
      { value: "No", label: "No, I read it in English directly" },
    ],
  },

  {
    key: "pt9_l0_Language",
    pdfKey: "pt9_l0_language",
    label: "What language did the interpreter use?",
    type: "text",
    section: "Part 8: Interpreter",
    placeholder: "e.g. Spanish / Arabic / Tagalog",
    condition: (data) => data.pt8_used === "Yes",
  },

  // Interpreter name
  {
    key: "pt9_lL1A_FamilyName",
    pdfKey: "pt9_ll1a_familyname",
    label: "Interpreter's last name?",
    type: "text",
    section: "Part 8: Interpreter",
    placeholder: "Last name",
    condition: (data) => data.pt8_used === "Yes",
    subQuestions: [
      {
        key: "pt9_lL1B_GivenName",
        pdfKey: "pt9_ll1b_givenname",
        label: "Interpreter's first name?",
        type: "text",
        section: "Part 8: Interpreter",
        placeholder: "First name",
      },
    ],
  },

  // Interpreter org
  {
    key: "pt9_lL2_BusOrgName",
    pdfKey: "pt9_ll2_busorgname",
    label: "Does the interpreter work for an organization?",
    type: "text",
    section: "Part 8: Interpreter",
    placeholder: "Organization name (if any)",
    skip: "They work independently",
    condition: (data) => data.pt8_used === "Yes",
  },

  // Interpreter mailing address
  {
    key: "pt9_lL3A_StreetNumberName",
    pdfKey: "pt9_ll3a_streetnumbername",
    label: "Interpreter's street address?",
    type: "text",
    section: "Part 8: Interpreter",
    placeholder: "Street number and name",
    condition: (data) => data.pt8_used === "Yes",
    subQuestions: [
      {
        key: "pt9_lLB_Unit",
        pdfKey: "pt9_llb_unit",
        label: "Unit type, Apt.",
        type: "checkbox",
        section: "Part 8: Interpreter",
      },
      {
        key: "pt9_lLB_Unit_1",
        pdfKey: "pt9_llb_unit_1",
        label: "Unit type, Ste.",
        type: "checkbox",
        section: "Part 8: Interpreter",
      },
      {
        key: "pt9_lLB_Unit_2",
        pdfKey: "pt9_llb_unit_2",
        label: "Unit type, Flr.",
        type: "checkbox",
        section: "Part 8: Interpreter",
      },
      {
        key: "pt9_lL3B_AptSteFlrNumber",
        pdfKey: "pt9_ll3b_aptsteflrnumber",
        label: "Unit number? (if any)",
        type: "text",
        section: "Part 8: Interpreter",
        placeholder: "e.g. Apt 4B",
        skip: "No unit number",
      },
    ],
  },
  {
    key: "pt9_lL3c_City",
    pdfKey: "pt9_ll3c_city",
    label: "Interpreter's city or town?",
    type: "text",
    section: "Part 8: Interpreter",
    placeholder: "City or town",
    condition: (data) => data.pt8_used === "Yes",
  },
  {
    key: "pt9_lL3d_State",
    pdfKey: "pt9_ll3d_state",
    label: "State? (if U.S. address)",
    type: "dropdown",
    isState: true,
    placeholder:"Select a state",
    section: "Part 8: Interpreter",
    placeholder: "e.g. CA / TX / NY",
    condition: (data) => data.pt8_used === "Yes",
    skip: "Not a U.S. address",
  },
  {
    key: "pt9_lL3e_ZipCode",
    pdfKey: "pt9_ll3e_zipcode",
    label: "ZIP code? (if U.S. address)",
    type: "text",
    section: "Part 8: Interpreter",
    placeholder: "5 digits",
    condition: (data) => data.pt8_used === "Yes",
    skip: "Not a U.S. address",
    validate: (v) => (!v || /^\d{5}$/.test(v) ? null : "Exactly 5 digits"),
  },
  {
    key: "pt9_lL3g_Province",
    pdfKey: "pt9_ll3g_province",
    label: "Province or region? (if outside the U.S.)",
    type: "text",
    section: "Part 8: Interpreter",
    placeholder: "Province / Region",
    condition: (data) => data.pt8_used === "Yes",
    skip: "Not applicable",
  },
  {
    key: "pt9_lL3f_PostalCode",
    pdfKey: "pt9_ll3f_postalcode",
    label: "Postal code? (if outside the U.S.)",
    type: "text",
    section: "Part 8: Interpreter",
    placeholder: "Postal code",
    condition: (data) => data.pt8_used === "Yes",
    skip: "Not applicable",
  },
  {
    key: "pt9_lL3h_Country",
    pdfKey: "pt9_ll3h_country",
    label: "Interpreter's country?",
    type: "country",
    section: "Part 8: Interpreter",
    placeholder: "Select a country",
    condition: (data) => data.pt8_used === "Yes",
  },

  // Interpreter contact
  {
    key: "pt9_lL4_DaytimeTelePhoneNumber1",
    pdfKey: "pt9_ll4_daytimetelephonenumber1",
    label: "Interpreter's daytime phone number?",
    type: "text",
    section: "Part 8: Interpreter",
    placeholder: "Phone number",
    condition: (data) => data.pt8_used === "Yes",
    validate: (v) => (/^[0-9\-\+\(\) ]{7,15}$/.test(v) ? null : "Enter a valid phone number"),
  },
  {
    key: "pt9_lL4_DaytimeTelePhoneNumber1_1",
    pdfKey: "pt9_ll4_daytimetelephonenumber1_1",
    label: "Interpreter's mobile number? (if any)",
    type: "text",
    section: "Part 8: Interpreter",
    placeholder: "Mobile number",
    condition: (data) => data.pt8_used === "Yes",
    skip: "Not applicable",
    validate: (v) => (!v || /^[0-9\-\+\(\) ]{7,15}$/.test(v) ? null : "Enter a valid phone number"),
  },
  {
    key: "pt9_lL5_EmailAddress",
    pdfKey: "pt9_ll5_emailaddress",
    label: "Interpreter's email address? (if any)",
    type: "text",
    section: "Part 8: Interpreter",
    placeholder: "email@example.com",
    condition: (data) => data.pt8_used === "Yes",
    skip: "No email",
    validate: (v) =>
      !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Enter a valid email address",
  },

  // Interpreter signature date
  {
    key: "pt9_lL6b_Date",
    pdfKey: "pt9_ll6b_date",
    label: "Date the interpreter signed?",
    type: "date",
    section: "Part 8: Interpreter",
    placeholder: "MM/DD/YYYY",
    condition: (data) => data.pt8_used === "Yes",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PART 9 — PREPARER INFORMATION
  // ══════════════════════════════════════════════════════════════════════════

  {
    key: "pt9_used",
    pdfKey: "",
    label: "Did someone other than yourself prepare this request?",
    hint: "A preparer is anyone, a lawyer, paralegal, volunteer, or friend, who filled in the form based on what you told them. If you did it yourself, skip this section.",
    type: "radio",
    section: "Part 9: Preparer",
    options: [
      { value: "Yes", label: "Yes, someone prepared this for me" },
      { value: "No", label: "No, I prepared it myself" },
    ],
  },

  // Preparer name
  {
    key: "pt10_lL1A_FamilyName",
    pdfKey: "pt10_ll1a_familyname",
    label: "Preparer's last name?",
    type: "text",
    section: "Part 9: Preparer",
    placeholder: "Last name",
    condition: (data) => data.pt9_used === "Yes",
    subQuestions: [
      {
        key: "pt10_lL1b_GivenName",
        pdfKey: "pt10_ll1b_givenname",
        label: "Preparer's first name?",
        type: "text",
        section: "Part 9: Preparer",
        placeholder: "First name",
      },
    ],
  },

  // Preparer org
  {
    key: "pt10_lL2_BusOrgName",
    pdfKey: "pt10_ll2_busorgname",
    label: "Does the preparer work for an organization or law firm?",
    type: "text",
    section: "Part 9: Preparer",
    placeholder: "e.g. Legal Aid Society",
    condition: (data) => data.pt9_used === "Yes",
    skip: "They work independently",
  },

  // Preparer mailing address
  {
    key: "pt10_lL3a_StreetNumberName",
    pdfKey: "pt10_ll3a_streetnumbername",
    label: "Preparer's street address?",
    type: "text",
    section: "Part 9: Preparer",
    placeholder: "Street number and name",
    condition: (data) => data.pt9_used === "Yes",
    subQuestions: [
      {
        key: "pt10_lL3b_Unit",
        pdfKey: "pt10_ll3b_unit",
        label: "Unit type, Apt.",
        type: "checkbox",
        section: "Part 9: Preparer",
      },
      {
        key: "pt10_lL3b_Unit_1",
        pdfKey: "pt10_ll3b_unit_1",
        label: "Unit type, Ste.",
        type: "checkbox",
        section: "Part 9: Preparer",
      },
      {
        key: "pt10_lL3b_Unit_2",
        pdfKey: "pt10_ll3b_unit_2",
        label: "Unit type, Flr.",
        type: "checkbox",
        section: "Part 9: Preparer",
      },
      {
        key: "pt10_lL3b_AptSteFlrNumber",
        pdfKey: "pt10_ll3b_aptsteflrnumber",
        label: "Unit number? (if any)",
        type: "text",
        section: "Part 9: Preparer",
        placeholder: "e.g. Apt 3C",
        skip: "No unit number",
      },
    ],
  },
  {
    key: "pt10_lL3c_City",
    pdfKey: "pt10_ll3c_city",
    label: "Preparer's city or town?",
    type: "text",
    section: "Part 9: Preparer",
    placeholder: "City or town",
    condition: (data) => data.pt9_used === "Yes",
  },
  {
    key: "pt10_lL3d_State",
    pdfKey: "pt10_ll3d_state",
    label: "State? (if U.S. address)",
    type: "dropdown",
    isState: true,
    placeholder:"Select a state",
    section: "Part 9: Preparer",
    condition: (data) => data.pt9_used === "Yes",
    skip: "Not a U.S. address",
  },
  {
    key: "pt10_lL3e_ZipCode",
    pdfKey: "pt10_ll3e_zipcode",
    label: "ZIP code? (if U.S. address)",
    type: "text",
    section: "Part 9: Preparer",
    placeholder: "5 digits",
    condition: (data) => data.pt9_used === "Yes",
    skip: "Not a U.S. address",
    validate: (v) => (!v || /^\d{5}$/.test(v) ? null : "Exactly 5 digits"),
  },
  {
    key: "pt10_lL3g_Province",
    pdfKey: "pt10_ll3g_province",
    label: "Province or region? (if outside the U.S.)",
    type: "text",
    section: "Part 9: Preparer",
    placeholder: "Province / Region",
    condition: (data) => data.pt9_used === "Yes",
    skip: "Not applicable",
  },
  {
    key: "pt10_lL3f_PostalCode",
    pdfKey: "pt10_ll3f_postalcode",
    label: "Postal code? (if outside the U.S.)",
    type: "text",
    section: "Part 9: Preparer",
    placeholder: "Postal code",
    condition: (data) => data.pt9_used === "Yes",
    skip: "Not applicable",
  },
  {
    key: "pt10_lL3h_Country",
    pdfKey: "pt10_ll3h_country",
    label: "Preparer's country?",
    type: "country",
    section: "Part 9: Preparer",
    placeholder: "Select a country",
    condition: (data) => data.pt9_used === "Yes",
  },

  // Preparer contact
  {
    key: "pt10_lL4_DaytimeTelePhoneNumber1",
    pdfKey: "pt10_ll4_daytimetelephonenumber1",
    label: "Preparer's daytime phone number?",
    type: "text",
    section: "Part 9: Preparer",
    placeholder: "Phone number",
    condition: (data) => data.pt9_used === "Yes",
    validate: (v) => (/^[0-9\-\+\(\) ]{7,15}$/.test(v) ? null : "Enter a valid phone number"),
  },
  {
    key: "pt10_lL5_FaxNumber1",
    pdfKey: "pt10_ll5_faxnumber1",
    label: "Preparer's fax number? (if any)",
    type: "text",
    section: "Part 9: Preparer",
    placeholder: "Fax number",
    condition: (data) => data.pt9_used === "Yes",
    skip: "No fax number",
  },
  {
    key: "pt10_lL6_EmailAddress",
    pdfKey: "pt10_ll6_emailaddress",
    label: "Preparer's email address? (if any)",
    type: "text",
    section: "Part 9: Preparer",
    placeholder: "email@example.com",
    condition: (data) => data.pt9_used === "Yes",
    skip: "No email",
    validate: (v) =>
      !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Enter a valid email address",
  },

  // Preparer statement — attorney or not
  {
    key: "pt10_lL7_chbx",
    pdfKey: "pt10_ll7_chbx",
    label: "Is the preparer an attorney or accredited representative?",
    hint: "An accredited representative is someone officially recognized by the Department of Justice to give immigration legal advice, usually a paralegal or advocate at an accredited nonprofit.",
    type: "radio",
    section: "Part 9: Preparer",
    condition: (data) => data.pt9_used === "Yes",
    options: [
      {
        value: "not_attorney",
        label: "No, not an attorney or accredited representative",
        sublabel: "They helped but are not a legal professional.",
      },
      { value: "attorney", label: "Yes, attorney or accredited representative" },
    ],
    subQuestions: [
      {
        key: "pt10_lL7_chbx_1",
        pdfKey: "pt10_ll7_chbx_1",
        label: "Not an attorney or accredited representative",
        type: "checkbox",
        section: "Part 9: Preparer",
      },
      {
        key: "pt10_lL7B_chbx",
        pdfKey: "pt10_ll7b_chbx",
        label: "Attorney / accredited representative, representation EXTENDS beyond this form",
        type: "checkbox",
        section: "Part 9: Preparer",
        condition: (data) => data.pt10_lL7_chbx === "attorney",
        tooltip:
          "Check this if the attorney or representative is helping with more of the immigration case, not just this fee waiver form. If they are only helping with this one form, choose the other option instead.",
      },
      {
        key: "pt10_lL7B_chbx_1",
        pdfKey: "pt10_ll7b_chbx_1",
        label:
          "Attorney / accredited representative, representation does NOT extend beyond this form",
        type: "checkbox",
        section: "Part 9: Preparer",
        condition: (data) => data.pt10_lL7_chbx === "attorney",
        tooltip:
          "Check this if the attorney or representative is only helping with this fee waiver form and nothing else in the immigration case.",
      },
    ],
  },

  // Interpreter cert in Part 10 (form label mismatch — maps to Part 9 section)
  {
    key: "pt10_lL6a_InterpretersSignature",
    pdfKey: "pt10_ll6a_interpreterssignature",
    label: "Interpreter's signature (Part 8 certification line)?",
    hint: "The interpreter certifies under penalty of perjury that they accurately interpreted this form.",
    type: "text",
    section: "Part 9: Preparer",
    placeholder: "Interpreter's full legal name",
    condition: (data) => data.pt8_used === "Yes",
  },

  // Preparer signature date
  {
    key: "pt10_lL8B_Date",
    pdfKey: "pt10_ll8b_date",
    label: "Date the preparer signed?",
    type: "date",
    section: "Part 9: Preparer",
    placeholder: "MM/DD/YYYY",
    condition: (data) => data.pt9_used === "Yes",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PART 10 — ADDITIONAL INFORMATION (continuation space)
  // ══════════════════════════════════════════════════════════════════════════

  {
    key: "pt10_more",
    pdfKey: "",
    label: "Do you need extra space to continue any earlier answer?",
    hint: "Most people select No. Only use this if an answer was too long to fit in the earlier section.",
    type: "radio",
    section: "Part 10: Additional Info",
    options: [
      { value: "Yes", label: "Yes, I need to continue something from earlier" },
      { value: "No", label: "No, everything fit fine" },
    ],
  },

  // Continuation entry 1
  {
    key: "pt11_l3a_PageNumber",
    pdfKey: "pt11_l3a_pagenumber",
    label: "Which page number are you continuing from?",
    type: "text",
    section: "Part 10: Additional Info",
    placeholder: "Page number",
    condition: (data) => data.pt10_more === "Yes",
    validate: (v) => (/^\d+$/.test(v) ? null : "Number only"),
    subQuestions: [
      {
        key: "pt11_l3b_PartNumber",
        pdfKey: "pt11_l3b_partnumber",
        label: "Which Part number?",
        type: "text",
        section: "Part 10: Additional Info",
        placeholder: "Part number",
        validate: (v) => (/^\d+$/.test(v) ? null : "Number only"),
      },
      {
        key: "pt11_l3c_ItemNumber",
        pdfKey: "pt11_l3c_itemnumber",
        label: "Which item number?",
        type: "text",
        section: "Part 10: Additional Info",
        placeholder: "Item number",
        validate: (v) => (/^\d+$/.test(v) ? null : "Number only"),
      },
      {
        key: "pt11_l3d_AdditionalInfo",
        pdfKey: "pt11_l3d_additionalinfo",
        label: "Continue your answer here.",
        type: "text",
        section: "Part 10: Additional Info",
        placeholder: "Type the rest of your answer here",
      },
    ],
  },

  {
    key: "pt10_has2",
    pdfKey: "",
    label: "Anything else to add?",
    type: "radio",
    section: "Part 10: Additional Info",
    condition: (data) => data.pt10_more === "Yes",
    options: [
      { value: "Yes", label: "Yes, one more" },
      { value: "No", label: "No, that's all" },
    ],
  },

  // Continuation entry 2
  {
    key: "pt11_l4a_PageNumber",
    pdfKey: "pt11_l4a_pagenumber",
    label: "Continuation entry 2, page number?",
    type: "text",
    section: "Part 10: Additional Info",
    placeholder: "Page number",
    condition: (data) => data.pt10_has2 === "Yes",
    validate: (v) => (/^\d+$/.test(v) ? null : "Number only"),
    subQuestions: [
      {
        key: "pt11_l4b_PartNumber",
        pdfKey: "pt11_l4b_partnumber",
        label: "Part number?",
        type: "text",
        section: "Part 10: Additional Info",
        placeholder: "Part number",
        validate: (v) => (/^\d+$/.test(v) ? null : "Number only"),
      },
      {
        key: "pt11_l4c_ItemNumber",
        pdfKey: "pt11_l4c_itemnumber",
        label: "Item number?",
        type: "text",
        section: "Part 10: Additional Info",
        placeholder: "Item number",
        validate: (v) => (/^\d+$/.test(v) ? null : "Number only"),
      },
    ],
  },

  {
    key: "pt10_has3",
    pdfKey: "",
    label: "One more entry?",
    type: "radio",
    section: "Part 10: Additional Info",
    condition: (data) => data.pt10_has2 === "Yes",
    options: [
      { value: "Yes", label: "Yes" },
      { value: "No", label: "No" },
    ],
  },

  // Continuation entry 3
  {
    key: "pt11_l5a_PageNumber",
    pdfKey: "pt11_l5a_pagenumber",
    label: "Continuation entry 3, page number?",
    type: "text",
    section: "Part 10: Additional Info",
    placeholder: "Page number",
    condition: (data) => data.pt10_has3 === "Yes",
    validate: (v) => (/^\d+$/.test(v) ? null : "Number only"),
    subQuestions: [
      {
        key: "pt11_l5b_PartNumber",
        pdfKey: "pt11_l5b_partnumber",
        label: "Part number?",
        type: "text",
        section: "Part 10: Additional Info",
        placeholder: "Part number",
        validate: (v) => (/^\d+$/.test(v) ? null : "Number only"),
      },
      {
        key: "pt11_l5c_ItemNumber",
        pdfKey: "pt11_l5c_itemnumber",
        label: "Item number?",
        type: "text",
        section: "Part 10: Additional Info",
        placeholder: "Item number",
        validate: (v) => (/^\d+$/.test(v) ? null : "Number only"),
      },
      {
        key: "pt11_l5d_AdditionalInfo",
        pdfKey: "pt11_l5d_additionalinfo",
        label: "Additional information?",
        type: "text",
        section: "Part 10: Additional Info",
        placeholder: "Type the rest of your answer here",
      },
    ],
  },

  {
    key: "pt10_has4",
    pdfKey: "",
    label: "One final entry?",
    type: "radio",
    section: "Part 10: Additional Info",
    condition: (data) => data.pt10_has3 === "Yes",
    options: [
      { value: "Yes", label: "Yes" },
      { value: "No", label: "No" },
    ],
  },

  // Continuation entry 4
  {
    key: "pt11_l6a_PageNumber",
    pdfKey: "pt11_l6a_pagenumber",
    label: "Continuation entry 4, page number?",
    type: "text",
    section: "Part 10: Additional Info",
    placeholder: "Page number",
    condition: (data) => data.pt10_has4 === "Yes",
    validate: (v) => (/^\d+$/.test(v) ? null : "Number only"),
    subQuestions: [
      {
        key: "pt11_l6b_PartNumber",
        pdfKey: "pt11_l6b_partnumber",
        label: "Part number?",
        type: "text",
        section: "Part 10: Additional Info",
        placeholder: "Part number",
        validate: (v) => (/^\d+$/.test(v) ? null : "Number only"),
      },
      {
        key: "pt11_l6c_ItemNumber",
        pdfKey: "pt11_l6c_itemnumber",
        label: "Item number?",
        type: "text",
        section: "Part 10: Additional Info",
        placeholder: "Item number",
        validate: (v) => (/^\d+$/.test(v) ? null : "Number only"),
      },
    ],
  },

  // Part 11 / 12 additional info fields (bottom of continuation pages)
  {
    key: "pt11_lL2_InterpretersSignature",
    pdfKey: "pt11_ll2_interpreterssignature",
    label: "Interpreter's name / signature (continuation page)?",
    hint: "If additional continuation pages are used, the interpreter re-signs here.",
    type: "text",
    section: "Part 10: Additional Info",
    placeholder: "Interpreter's full name",
    skip: "Not applicable",
    condition: (data) => data.pt8_used === "Yes",
  },
  {
    key: "pt12_l4d_AdditionalInfo",
    pdfKey: "pt12_l4d_additionalinfo",
    label: "Additional information (Part 12, continuation line 4)?",
    type: "text",
    section: "Part 10: Additional Info",
    placeholder: "Additional information",
    skip: "Not needed",
  },
  {
    key: "pt12_l6d_AdditionalInfo",
    pdfKey: "pt12_l6d_additionalinfo",
    label: "Additional information (Part 12, continuation line 6)?",
    type: "text",
    section: "Part 10: Additional Info",
    placeholder: "Additional information",
    skip: "Not needed",
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────
export const getInitialFormData = (): Record<string, string> => {
  const data: Record<string, string> = {};
  const collectKeys = (fields: RichField[]) => {
    fields.forEach((f) => {
      if (f.key) data[f.key] = "";
      if (f.subQuestions) collectKeys(f.subQuestions as RichField[]);
    });
  };
  collectKeys(formFields);
  return data;
};

export const overflowFields = [
  {
    prefix: "pt3_member",
    countKey: "pt3_member_count",
    startIndex: 3,
    maxIndex: 8,
    pageNumber: "3",
    partNumber: "3",
    itemNumber: "1",
    labelPrefix: "Household Member",
    fields: [
      { suffix: "name", label: "Full Name" },
      { suffix: "rel", label: "Relationship" },
      { suffix: "dob", label: "Date of Birth" },
      { suffix: "income", label: "Income" },
    ],
    formatInfo: (index: number, data: Record<string, string>) => {
      const name = data[`pt3_member_${index}_name`] || "";
      const rel = data[`pt3_member_${index}_rel`] || "";
      const dob = data[`pt3_member_${index}_dob`] || "";
      const income = data[`pt3_member_${index}_income`] || "";

      let info = `Household Member ${index}: ${name}`;
      if (rel) info += ` (${rel})`;
      if (dob) info += `, DOB: ${dob}`;
      if (income) info += `, Income: $${income}`;
      return info + ".";
    },
  },
];

export const i912Config = {
  formId,
  formTitle,
  formSubtitle,
  formFields,
  getInitialFormData,
  sectionIntroMessages,
  overflowFields,
};

export default i912Config;
