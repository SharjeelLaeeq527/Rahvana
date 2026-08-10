FIELD_MAPPING = {
    # ============================================
    # PAGE 1: Header & Part 1 (Information About You)
    # ============================================
    # Header
    "p1_alien_number": "form1[0].#subform[0].AlienNumber[0]",

    # Part 1, Line 1: Current Legal Name
    "p1_legal_family_name": "form1[0].#subform[0].Pt1Line1_FamilyName[0]",
    "p1_legal_given_name": "form1[0].#subform[0].Pt1Line1_GivenName[0]",
    "p1_legal_middle_name": "form1[0].#subform[0].Pt1Line1_MiddleName[0]",

    # Part 1, Line 2: Other Names Used (Name 1)
    "p1_other_name1_family": "form1[0].#subform[0].Pt1Line2_FamilyName[0]",
    "p1_other_name1_given": "form1[0].#subform[0].Pt1Line2_GivenName[0]",
    "p1_other_name1_middle": "form1[0].#subform[0].Pt1Line2_MiddleName[0]",

    # Part 1, Line 2a: Other Names Used (Name 2)
    "p1_other_name2_family": "form1[0].#subform[0].Pt1Line2a_FamilyName[0]",
    "p1_other_name2_given": "form1[0].#subform[0].Pt1Line2a_GivenName[0]",
    "p1_other_name2_middle": "form1[0].#subform[0].Pt1Line2a_MiddleName[0]",

    # Part 1, Line 3: Date of Birth & Other Birth Dates
    "p1_dob": "form1[0].#subform[0].Pt1Line3_DOB[0]",
    "p1_other_dob_Yes": "form1[0].#subform[0].Pt1Line3_YN[0]",
    "p1_other_dob_No": "form1[0].#subform[0].Pt1Line3_YN[1]",
    "p1_other_dob1": "form1[0].#subform[0].Pt1Line3A_OtherDOB[0]",
    "p1_other_dob2": "form1[0].#subform[0].Pt1Line3B_OtherDOB[0]",

    # ============================================
    # PAGE 2: Part 1 (Information About You - Continued)
    # ============================================
    # Page 2 Header & Barcode
    # "p2_barcode": "form1[0].#pageSet[0].Page1[1].PDF417BarCode2[0]",
    "p2_header_alien_number": "form1[0].#subform[1].AlienNumber[1]",

    # Line 4: A-Number Question
    "p1_item4_has_alien_Yes": "form1[0].#subform[1].Pt1Line4_YN[0]",
    "p1_item4_has_alien_No": "form1[0].#subform[1].Pt1Line4_YN[1]",
    "p1_item4_alien_number": "form1[0].#subform[1].Pt1Line4_AlienNumber[0]",

    # Line 5: Other A-Numbers Assigned
    "p1_has_other_alien_Yes": "form1[0].#subform[1].Pt1Line5_YN[0]",
    "p1_has_other_alien_No": "form1[0].#subform[1].Pt1Line5_YN[1]",
    "p1_other_alien_number1": "form1[0].#subform[1].Pt1Line5A_ANumber[0]",
    "p1_other_alien_number2": "form1[0].#subform[1].Pt1Line5B_ANumber[0]",

    # Line 6: Sex
    "p1_sex_Female": "form1[0].#subform[1].Pt1Line6_CB_Sex[0]",
    "p1_sex_Male": "form1[0].#subform[1].Pt1Line6_CB_Sex[1]",

    # Line 7: Place of Birth
    "p1_city_of_birth": "form1[0].#subform[1].Pt1Line7_CityTownOfBirth[0]",
    "p1_country_of_birth": "form1[0].#subform[1].Pt1Line7_CountryOfBirth[0]",

    # Line 8: Country of Citizenship or Nationality
    "p1_country_of_citizenship": "form1[0].#subform[1].Pt1Line8_CountryofCitizenshipNationality[0]",

    # Line 9: USCIS Online Account Number
    "p1_uscis_account_number": "form1[0].#subform[1].Pt1Line9_USCISAccountNumber[0]",

    # Line 10: Recent Immigration History
    "p1_passport_number": "form1[0].#subform[1].Pt1Line10_PassportNum[0]",
    "p1_passport_exp_date": "form1[0].#subform[1].Pt1Line10_ExpDate[0]",
    "p1_passport_country": "form1[0].#subform[1].Pt1Line10_Passport[0]",
    "p1_visa_number": "form1[0].#subform[1].Pt1Line10_VisaNum[0]",
    "p1_visa_issue_date": "form1[0].#subform[1].Pt1Line10_NonImmDate[0]",
    "p1_last_arrival_city": "form1[0].#subform[1].Pt1Line10_CityTown[0]",
    "p1_last_arrival_state": "form1[0].#subform[1].Pt1Line10_State[0]",
    "p1_last_arrival_date": "form1[0].#subform[1].Pt1Line10_DateofArrival[0]",

    # Line 11: Arrival Status in the United States
    "p1_arrival_status_admitted_cb": "form1[0].#subform[1].Pt2Line11_CB[0]",
    "p1_arrival_admitted_as": "form1[0].#subform[1].Pt1Line11_Admitted[0]",
    "p1_arrival_status_paroled_cb": "form1[0].#subform[1].Pt2Line11_CB[1]",
    "p1_arrival_paroled_as": "form1[0].#subform[1].Pt1Line11_Paroled[0]",
    "p1_arrival_status_without_admission_cb": "form1[0].#subform[1].Pt2Line11_CB[2]",
    "p1_arrival_status_other_cb": "form1[0].#subform[1].Pt2Line11_CB[3]",
    "p1_arrival_status_other_text": "form1[0].#subform[1].Pt1Line11_Other[0]",

    # ============================================
    # PAGE 3: Part 1 (Information About You - Continued)
    # ============================================
    # Page 3 Header & Barcode
    # "p3_barcode": "form1[0].#pageSet[0].Page1[2].PDF417BarCode2[0]",
    "p3_header_alien_number": "form1[0].#subform[2].AlienNumber[2]",

    # Line 12: Form I-94 Arrival/Departure Record Details
    "p1_i94_family_name": "form1[0].#subform[2].P1Line12_FamilyName[0]",
    "p1_i94_given_name": "form1[0].#subform[2].P1Line13_GivenName[0]",
    "p1_i94_number": "form1[0].#subform[2].P1Line12_I94[0]",
    "p1_i94_exp_date": "form1[0].#subform[2].Pt1Line12_Date[0]",
    "p1_i94_status": "form1[0].#subform[2].Pt1Line12_Status[0]",

    # Line 13: First time physically present in US
    "p1_first_time_in_us_Yes": "form1[0].#subform[2].Pt1Line13_YN[0]",
    "p1_first_time_in_us_No": "form1[0].#subform[2].Pt1Line13_YN[1]",

    # Line 14: Current Immigration Status
    "p1_current_immigration_status": "form1[0].#subform[2].Pt1Line14_Status[0]",

    # Line 15: Expiration Date of Current Immigration Status
    "p1_current_status_exp_date": "form1[0].#subform[2].Pt1Line15_Date[0]",

    # Line 16: Alien Crewman Visa
    "p1_crewman_visa_Yes": "form1[0].#subform[2].Pt1Line16_YN[0]",
    "p1_crewman_visa_No": "form1[0].#subform[2].Pt1Line16_YN[1]",

    # Line 17: Vessel Seaman / Crewman Arrival
    "p1_seaman_crewman_arrival_Yes": "form1[0].#subform[2].Pt1Line17_YN[0]",
    "p1_seaman_crewman_arrival_No": "form1[0].#subform[2].Pt1Line17_YN[1]",

    # Line 18: Current U.S. Physical Address
    "p1_phys_in_care_of": "form1[0].#subform[2].Part1_Item18_InCareOfName[0]",
    "p1_phys_street": "form1[0].#subform[2].Pt1Line18_StreetNumberName[0]",
    "p1_phys_unit_apt": "form1[0].#subform[2].Pt1Line18US_Unit[0]",
    "p1_phys_unit_ste": "form1[0].#subform[2].Pt1Line18US_Unit[1]",
    "p1_phys_unit_flr": "form1[0].#subform[2].Pt1Line18US_Unit[2]",
    "p1_phys_unit_val": "form1[0].#subform[2].Pt1Line18US_AptSteFlrNumber[0]",
    "p1_phys_city": "form1[0].#subform[2].Pt1Line18_CityOrTown[0]",
    "p1_phys_state": "form1[0].#subform[2].Pt1Line18_State[0]",
    "p1_phys_zip": "form1[0].#subform[2].Pt1Line18_ZipCode[0]",
    "p1_phys_date_resided_from": "form1[0].#subform[2].Pt1Line18_Date[0]",

    # Line 18 (Continued): Is this your current mailing address?
    "p1_is_current_mailing_same_Yes": "form1[0].#subform[2].Pt1Line18_YN[0]",
    "p1_is_current_mailing_same_No": "form1[0].#subform[2].Pt1Line18_YN[1]",

    # Line 18 (Continued): Current Mailing Address (Safe/Alternate Mailing Address)
    "p1_mail_in_care_of": "form1[0].#subform[2].Pt1Line18_CurrentInCareOfName[0]",
    "p1_mail_street": "form1[0].#subform[2].Pt1Line18_CurrentStreetNumberName[0]",
    "p1_mail_unit_apt": "form1[0].#subform[2].Pt1Line18_CurrentUnit[0]",
    "p1_mail_unit_ste": "form1[0].#subform[2].Pt1Line18_CurrentUnit[1]",
    "p1_mail_unit_flr": "form1[0].#subform[2].Pt1Line18_CurrentUnit[2]",
    "p1_mail_unit_val": "form1[0].#subform[2].Pt1Line18_CurrentAptSteFlrNumber[0]",
    "p1_mail_city": "form1[0].#subform[2].Pt1Line18_CurrentCityOrTown[0]",
    "p1_mail_state": "form1[0].#subform[2].Pt1Line18_CurrentState[0]",
    "p1_mail_zip": "form1[0].#subform[2].Pt1Line18_CurrentZipCode[0]",

    # ============================================
    # PAGE 4: Part 1 (Information About You - Continued)
    # ============================================
    # Page 4 Header & Barcode
    # "p4_barcode": "form1[0].#pageSet[0].Page1[3].PDF417BarCode2[0]",
    "p4_header_alien_number": "form1[0].#subform[3].AlienNumber[3]",

    # Line 18 (Continued): Resided at current address for at least 5 years?
    "p1_resided_5yrs_Yes": "form1[0].#subform[3].Pt1Line18_last5yrs_YN[0]",
    "p1_resided_5yrs_No": "form1[0].#subform[3].Pt1Line18_last5yrs_YN[1]",

    # Prior Address (for last 5 years)
    "p1_prior_in_care_of": "form1[0].#subform[3].Pt1Line18_PriorInCareOfName[0]",
    "p1_prior_street": "form1[0].#subform[3].Pt1Line18_PriorStreetName[0]",
    "p1_prior_unit_apt": "form1[0].#subform[3].Pt1Line18_PriorAddress_Unit[0]",
    "p1_prior_unit_ste": "form1[0].#subform[3].Pt1Line18_PriorAddress_Unit[1]",
    "p1_prior_unit_flr": "form1[0].#subform[3].Pt1Line18_PriorAddress_Unit[2]",
    "p1_prior_unit_val": "form1[0].#subform[3].Pt1Line18_PriorAddress_Number[0]",
    "p1_prior_city": "form1[0].#subform[3].Pt1Line18_PriorCity[0]",
    "p1_prior_state": "form1[0].#subform[3].Pt1Line18_PriorState[0]",
    "p1_prior_zip": "form1[0].#subform[3].Pt1Line18_PriorZipCode[0]",
    "p1_prior_province": "form1[0].#subform[3].Pt1Line18_PriorProvince[0]",
    "p1_prior_postal": "form1[0].#subform[3].Pt1Line18_PriorPostalCode[0]",
    "p1_prior_country": "form1[0].#subform[3].Pt1Line18_PriorCountry[0]",
    "p1_prior_date_from": "form1[0].#subform[3].Pt1Line18_PriorDateFrom[0]",
    "p1_prior_date_to": "form1[0].#subform[3].Pt1Line18PriorDateTo[0]",

    # Most Recent Address Outside the United States
    "p1_foreign_recent_street": "form1[0].#subform[3].Pt1Line18_RecentStreetName[0]",
    "p1_foreign_recent_unit_apt": "form1[0].#subform[3].Pt1Line18_RecentUnit[0]",
    "p1_foreign_recent_unit_ste": "form1[0].#subform[3].Pt1Line18_RecentUnit[1]",
    "p1_foreign_recent_unit_flr": "form1[0].#subform[3].Pt1Line18_RecentUnit[2]",
    "p1_foreign_recent_unit_val": "form1[0].#subform[3].Pt1Line18_RecentNumber[0]",
    "p1_foreign_recent_city": "form1[0].#subform[3].Pt1Line18_RecentCity[0]",
    "p1_foreign_recent_state": "form1[0].#subform[3].Pt1Line18_RecentState[0]",
    "p1_foreign_recent_zip": "form1[0].#subform[3].Pt1Line18_RecentZipCode[0]",
    "p1_foreign_recent_province": "form1[0].#subform[3].Pt1Line18_RecentProvince[0]",
    "p1_foreign_recent_postal": "form1[0].#subform[3].Pt1Line18_RecentPostalCode[0]",
    "p1_foreign_recent_country": "form1[0].#subform[3].Pt1Line18_RecentCountry[0]",
    "p1_foreign_recent_date_from": "form1[0].#subform[3].Pt1Line18_RecentDateFrom[0]",
    "p1_foreign_recent_date_to": "form1[0].#subform[3].Pt1Line18_RecentDateTo[0]",

    # Line 19: Social Security Card
    "p1_ssn_issued_Yes": "form1[0].#subform[3].Pt1Line19_YN[1]",
    "p1_ssn_issued_No": "form1[0].#subform[3].Pt1Line19_YN[0]",
    "p1_ssn_number": "form1[0].#subform[3].Pt1Line19_SSN[0]",
    "p1_want_ssa_card_Yes": "form1[0].#subform[3].Pt1Line19_SSA_YN[0]",
    "p1_want_ssa_card_No": "form1[0].#subform[3].Pt1Line19_SSA_YN[1]",
    "p1_ssa_consent_Yes": "form1[0].#subform[3].Pt1Line19_Consent_YN[0]",
    "p1_ssa_consent_No": "form1[0].#subform[3].Pt1Line19_Consent_YN[1]",

    # ============================================
    # PAGE 5: Part 2 (Application Type or Filing Category)
    # ============================================
    # Page 5 Header & Barcode
    # "p5_barcode": "form1[0].#pageSet[0].Page1[4].PDF417BarCode2[0]",
    "p5_header_alien_number": "form1[0].#subform[4].AlienNumber[4]",

    # Line 1: EOIR Removal/Deportation Proceedings
    "p2_eoir_proceedings_Yes": "form1[0].#subform[4].Pt2Line1_YN[0]",
    "p2_eoir_proceedings_No": "form1[0].#subform[4].Pt2Line1_YN[1]",

    # Line 2: Underlying Petition Details
    "p2_underlying_receipt_number": "form1[0].#subform[4].Pt2Line2_Receipt[0]",
    "p2_underlying_priority_date": "form1[0].#subform[4].Pt2Line2_Date[0]",

    # Line 2 (Continued): Applicant Filing Type (Principal vs Derivative)
    "p2_applicant_type_principal_cb": "form1[0].#subform[4].Pt2Line2_CB[0]",
    "p2_applicant_type_derivative_cb": "form1[0].#subform[4].Pt2Line2_CB[1]",

    # Principal Applicant Details (if filing as Derivative)
    "p2_principal_family_name": "form1[0].#subform[4].Pt2Line2_FamilyName[0]",
    "p2_principal_given_name": "form1[0].#subform[4].Pt2Line2_GivenName[0]",
    "p2_principal_middle_name": "form1[0].#subform[4].Pt2Line2_MiddleName[0]",
    "p2_principal_alien_number": "form1[0].#subform[4].Pt2Line2_AlienNumber[0]",
    "p2_principal_dob": "form1[0].#subform[4].Pt1Line2_DOB[0]",

    # Line 3.a: Family-Based Categories (15 Checkboxes)
    "p2_cat_spouse_usc_cb": "form1[0].#subform[4].Pt2Line3a_CB[0]",
    "p2_cat_child_usc_cb": "form1[0].#subform[4].Pt2Line3a_CB[1]",
    "p2_cat_parent_usc_cb": "form1[0].#subform[4].Pt2Line3a_CB[2]",
    "p2_cat_k1_k2_cb": "form1[0].#subform[4].Pt2Line3a_CB[3]",
    "p2_cat_widow_usc_cb": "form1[0].#subform[4].Pt2Line3a_CB[4]",
    "p2_cat_ndaa_cb": "form1[0].#subform[4].Pt2Line3a_CB[5]",
    "p2_cat_f1_son_daughter_usc_cb": "form1[0].#subform[4].Pt2Line3a_CB[6]",
    "p2_cat_f3_married_son_daughter_usc_cb": "form1[0].#subform[4].Pt2Line3a_CB[7]",
    "p2_cat_f4_sibling_usc_cb": "form1[0].#subform[4].Pt2Line3a_CB[8]",
    "p2_cat_f2a_spouse_lpr_cb": "form1[0].#subform[4].Pt2Line3a_CB[9]",
    "p2_cat_f2a_child_lpr_cb": "form1[0].#subform[4].Pt2Line3a_CB[10]",
    "p2_cat_f2b_son_daughter_lpr_cb": "form1[0].#subform[4].Pt2Line3a_CB[11]",
    "p2_cat_vawa_spouse_cb": "form1[0].#subform[4].Pt2Line3a_CB[12]",
    "p2_cat_vawa_child_cb": "form1[0].#subform[4].Pt2Line3a_CB[13]",
    "p2_cat_vawa_parent_cb": "form1[0].#subform[4].Pt2Line3a_CB[14]",

    # ============================================
    # PAGE 6: Part 2 (Application Type - Employment & Special Immigrant)
    # ============================================
    # Page 6 Header
    "p6_header_alien_number": "form1[0].#subform[5].AlienNumber[5]",

    # Line 3.b: Employment-based Categories
    "p2_cat_eb_i526_cb": "form1[0].#subform[5].Pt2Line3b_CB526[0]",
    "p2_cat_eb_extraordinary_cb": "form1[0].#subform[5].Pt2Line3b_CB140[0]",
    "p2_cat_eb_professor_researcher_cb": "form1[0].#subform[5].Pt2Line3b_CB140[1]",
    "p2_cat_eb_multinational_exec_cb": "form1[0].#subform[5].Pt2Line3b_CB140[2]",
    "p2_cat_eb_advanced_degree_cb": "form1[0].#subform[5].Pt2Line3b_CB140[3]",
    "p2_cat_eb_professional_cb": "form1[0].#subform[5].Pt2Line3b_CB140[4]",
    "p2_cat_eb_skilled_worker_cb": "form1[0].#subform[5].Pt2Line3b_CB140[5]",
    "p2_cat_eb_other_worker_cb": "form1[0].#subform[5].Pt2Line3b_CB140[6]",
    "p2_cat_eb_niw_cb": "form1[0].#subform[5].Pt2Line3b_CB140[7]",

    # Relative Form I-140 / Ownership Interest
    "p2_i140_relative_na_cb": "form1[0].#subform[5].Pt2Line3b_CB140Assoc[0]",
    "p2_i140_relative_no_cb": "form1[0].#subform[5].Pt2Line3b_CB140Assoc[1]",
    "p2_i140_relative_yes_cb": "form1[0].#subform[5].Pt2Line3b_CB140Assoc[2]",

    # Relative Relationship Type
    "p2_relative_type_father_cb": "form1[0].#subform[5].Pt2Relative_CB[0]",
    "p2_relative_type_mother_cb": "form1[0].#subform[5].Pt2Relative_CB[1]",
    "p2_relative_type_child_cb": "form1[0].#subform[5].Pt2Relative_CB[2]",
    "p2_relative_type_adult_son_cb": "form1[0].#subform[5].Pt2Relative_CB[3]",
    "p2_relative_type_adult_daughter_cb": "form1[0].#subform[5].Pt2Relative_CB[4]",
    "p2_relative_type_brother_cb": "form1[0].#subform[5].Pt2Relative_CB[5]",
    "p2_relative_type_sister_cb": "form1[0].#subform[5].Pt2Relative_CB[6]",
    "p2_relative_type_none_cb": "form1[0].#subform[5].Pt2Relative_CB[7]",

    # Relative Citizenship / Status
    "p2_relative_status_usc_cb": "form1[0].#subform[5].Pt2RelativeType_CB[0]",
    "p2_relative_status_us_national_cb": "form1[0].#subform[5].Pt2RelativeType_CB[1]",
    "p2_relative_status_lpr_cb": "form1[0].#subform[5].Pt2RelativeType_CB[2]",
    "p2_relative_status_none_cb": "form1[0].#subform[5].Pt2RelativeType_CB[3]",

    # Line 3.c: Special Immigrant Categories (10 Checkboxes)
    "p2_cat_special_afghan_iraqi_cb": "form1[0].#subform[5].Pt2Line3c_CB[0]",
    "p2_cat_special_juvenile_cb": "form1[0].#subform[5].Pt2Line3c_CB[1]",
    "p2_cat_special_g4_nato6_cb": "form1[0].#subform[5].Pt2Line3c_CB[2]",
    "p2_cat_special_broadcaster_cb": "form1[0].#subform[5].Pt2Line3c_CB[3]",
    "p2_cat_special_panama_canal_cb": "form1[0].#subform[5].Pt2Line3c_CB[4]",
    "p2_cat_special_armed_forces_cb": "form1[0].#subform[5].Pt2Line3c_CB[5]",
    "p2_cat_special_physicians_cb": "form1[0].#subform[5].Pt2Line3c_CB[6]",
    "p2_cat_special_us_govt_abroad_cb": "form1[0].#subform[5].Pt2Line3c_CB[7]",
    "p2_cat_special_religious_other_cb": "form1[0].#subform[5].Pt2Line3c_CB[8]",
    "p2_cat_special_religious_minister_cb": "form1[0].#subform[5].Pt2Line3c_CB[9]",

    # ============================================
    # PAGE 7: Part 2 (Asylee/Refugee, Crime Victim, Special Programs, Additional Options)
    # ============================================
    # Page 7 Header & Barcode
    "p7_barcode": "form1[0].#pageSet[0].Page1[6].PDF417BarCode2[0]",
    "p7_header_alien_number": "form1[0].#subform[6].AlienNumber[6]",

    # Line 3.d: Asylee or Refugee
    "p2_cat_asylum_cb": "form1[0].#subform[6].Pt2Line3d_AsyleeRefugeeCB[0]",
    "p2_asylum_granted_date": "form1[0].#subform[6].Pt2Line3d_Asylum[0]",
    "p2_cat_refugee_cb": "form1[0].#subform[6].Pt2Line3d_AsyleeRefugeeCB[1]",
    "p2_refugee_admission_date": "form1[0].#subform[6].Pt2Line3d_Refugee[0]",

    # Line 3.e: Human Trafficking Victim or Crime Victim
    "p2_cat_trafficking_t_cb": "form1[0].#subform[6].Pt2Line3e_CB[0]",
    "p2_cat_crime_u_cb": "form1[0].#subform[6].Pt2Line3e_CB[1]",

    # Line 3.f: Special Programs Based on Public Laws (8 Checkboxes)
    "p2_cat_cuban_adj_cb": "form1[0].#subform[6].Pt2Line3f_CB[0]",
    "p2_cat_cuban_cruelty_cb": "form1[0].#subform[6].Pt2Line3f_CB[1]",
    "p2_cat_haitian_adj_cb": "form1[0].#subform[6].Pt2Line3f_CB[2]",
    "p2_cat_haitian_cruelty_cb": "form1[0].#subform[6].Pt2Line3f_CB[3]",
    "p2_cat_lautenberg_cb": "form1[0].#subform[6].Pt2Line3f_CB[4]",
    "p2_cat_section13_diplomat_cb": "form1[0].#subform[6].Pt2Line3f_CB[5]",
    "p2_cat_indochinese_cb": "form1[0].#subform[6].Pt2Line3f_CB[6]",
    "p2_cat_amerasian_cb": "form1[0].#subform[6].Pt2Line3f_CB[7]",

    # Line 3.g: Additional Options (5 Checkboxes & Text inputs)
    "p2_cat_dv_program_cb": "form1[0].#subform[6].Pt2Line3g_CB[0]",
    "p2_dv_rank_number": "form1[0].#subform[6].Pt2Line1g_DV[0]",
    "p2_cat_registry_1972_cb": "form1[0].#subform[6].Pt2Line3g_CB[1]",
    "p2_cat_us_born_diplomatic_cb": "form1[0].#subform[6].Pt2Line3g_CB[2]",
    "p2_cat_s_visa_cb": "form1[0].#subform[6].Pt2Line3g_CB[3]",
    "p2_cat_other_eligibility_cb": "form1[0].#subform[6].Pt2Line3g_CB[4]",
    "p2_other_eligibility_text": "form1[0].#subform[6].Pt2Line1g_OtherEligibility[0]",

    # Line 4: INA Section 245(i) Adjustment
    "p2_ina_245i_Yes": "form1[0].#subform[6].Pt2Line4_CB[1]",
    "p2_ina_245i_No": "form1[0].#subform[6].Pt2Line4_CB[0]",

    # Line 5: Child Status Protection Act (CSPA) Adjustment
    "p2_cspa_child_Yes": "form1[0].#subform[6].Pt2Line5_CB[1]",
    "p2_cspa_child_No": "form1[0].#subform[6].Pt2Line5_CB[0]",

    # ============================================
    # PAGE 8: Part 3 (Affidavit of Support Exemption) & Part 4 (Additional Info & Employment)
    # ============================================
    # Page 8 Header & Barcode
    "p8_barcode": "form1[0].#pageSet[0].Page1[7].PDF417BarCode2[0]",
    "p8_header_alien_number": "form1[0].#subform[7].AlienNumber[7]",

    # Part 3 Item 1: Request for Exemption (Form I-864)
    "p3_exemption_40_quarters_cb": "form1[0].#subform[7].Pt3Line1_CB[0]",
    "p3_exemption_child_ina320_cb": "form1[0].#subform[7].Pt3Line1_CB[1]",
    "p3_exemption_widow_usc_cb": "form1[0].#subform[7].Pt3Line1_CB[2]",
    "p3_exemption_vawa_cb": "form1[0].#subform[7].Pt3Line1_CB[3]",
    "p3_exemption_not_required_cb": "form1[0].#subform[7].Pt3Line1_CB[4]",
    "p3_exemption_none_required_i864_cb": "form1[0].#subform[7].Pt3Line1_CB[5]",

    # Part 4 Item 1: Applied for Immigrant Visa Abroad
    "p4_applied_visa_abroad_Yes": "form1[0].#subform[7].Pt4Line1_YN[1]",
    "p4_applied_visa_abroad_No": "form1[0].#subform[7].Pt4Line1_YN[0]",

    # Part 4 Items 2-4: Visa Application Details
    "p4_visa_consulate_city": "form1[0].#subform[7].Pt4Line2_CityTown[0]",
    "p4_visa_consulate_country": "form1[0].#subform[7].Pt4Line2_CityTownOfBirth[0]",
    "p4_visa_decision": "form1[0].#subform[7].Pt4Line3_Decision[0]",
    "p4_visa_decision_date": "form1[0].#subform[7].Pt4Line4_Date[0]",

    # Part 4 Item 5: Previously Applied for Permanent Residence in US
    "p4_prev_applied_pr_us_Yes": "form1[0].#subform[7].Pt4Line5_YN[1]",
    "p4_prev_applied_pr_us_No": "form1[0].#subform[7].Pt4Line5_YN[0]",

    # Part 4 Item 6: LPR Status Rescinded
    "p4_lpr_rescinded_Yes": "form1[0].#subform[7].Pt4Line6_YN[1]",
    "p4_lpr_rescinded_No": "form1[0].#subform[7].Pt4Line6_YN[0]",

    # Part 4 Item 7: Employment & Educational History (Item 1)
    "p4_emp1_type": "form1[0].#subform[7].Pt4Line7_EmployerName[0]",
    "p4_emp1_name": "form1[0].#subform[7].Pt4Line7_EmployerName[2]",
    "p4_emp1_occupation": "form1[0].#subform[7].Pt4Line7_EmployerName[1]",

    # ============================================
    # PAGE 9: Part 4 (Employment 1 Address/Dates & Foreign Employer) & Part 5 (Parent 1)
    # ============================================
    # Page 9 Header & Barcode
    "p9_barcode": "form1[0].#pageSet[0].Page1[8].PDF417BarCode2[0]",
    "p9_header_alien_number": "form1[0].#subform[8].AlienNumber[8]",

    # Part 4 Item 7 Continued: Employer 1 Address & Dates
    "p4_emp1_street": "form1[0].#subform[8].Part4Line7_StreetName[0]",
    "p4_emp1_unit_apt": "form1[0].#subform[8].P4Line7_Unit[0]",
    "p4_emp1_unit_ste": "form1[0].#subform[8].P4Line7_Unit[1]",
    "p4_emp1_unit_flr": "form1[0].#subform[8].P4Line7_Unit[2]",
    "p4_emp1_unit_val": "form1[0].#subform[8].P4Line7_Number[0]",
    "p4_emp1_city": "form1[0].#subform[8].P4Line7_City[0]",
    "p4_emp1_state": "form1[0].#subform[8].P4Line7_State[0]",
    "p4_emp1_zip": "form1[0].#subform[8].P4Line7_ZipCode[0]",
    "p4_emp1_province": "form1[0].#subform[8].P4Line7_Province[0]",
    "p4_emp1_postal": "form1[0].#subform[8].P4Line7_PostalCode[0]",
    "p4_emp1_country": "form1[0].#subform[8].P4Line7_Country[0]",
    "p4_emp1_date_from": "form1[0].#subform[8].Pt4Line7_DateFrom[0]",
    "p4_emp1_date_to": "form1[0].#subform[8].Pt4Line7_DateTo[0]",
    "p4_emp1_support_source": "form1[0].#subform[8].Part4Line7_StreetName[1]",

    # Part 4 Item 8: Foreign Employer / School
    "p4_emp2_foreign_name": "form1[0].#subform[8].Pt4Line8_EmployerName[0]",
    "p4_emp2_foreign_occupation": "form1[0].#subform[8].Pt4Line8_Occupation[0]",
    "p4_emp2_foreign_street": "form1[0].#subform[8].P4Line8_StreetName[0]",
    "p4_emp2_foreign_unit_apt": "form1[0].#subform[8].P4Line8_Unit[0]",
    "p4_emp2_foreign_unit_ste": "form1[0].#subform[8].P4Line8_Unit[1]",
    "p4_emp2_foreign_unit_flr": "form1[0].#subform[8].P4Line8_Unit[2]",
    "p4_emp2_foreign_unit_val": "form1[0].#subform[8].P4Line8_Number[0]",
    "p4_emp2_foreign_city": "form1[0].#subform[8].P4Line8_City[0]",
    "p4_emp2_foreign_state": "form1[0].#subform[8].P4Line8_State[0]",
    "p4_emp2_foreign_zip": "form1[0].#subform[8].P4Line8_ZipCode[0]",
    "p4_emp2_foreign_province": "form1[0].#subform[8].P4Line8_Province[0]",
    "p4_emp2_foreign_postal": "form1[0].#subform[8].P4Line8_PostalCode[0]",
    "p4_emp2_foreign_country": "form1[0].#subform[8].P4Line8_Country[0]",
    "p4_emp2_foreign_date_from": "form1[0].#subform[8].Pt4Line8_DateFrom[0]",
    "p4_emp2_foreign_date_to": "form1[0].#subform[8].Pt4Line8_DateTo[0]",
    "p4_emp2_foreign_support_source": "form1[0].#subform[8].Part4Line8_StreetName[0]",

    # Part 5: Information About Your Parents (Parent 1)
    "p5_parent1_legal_family_name": "form1[0].#subform[8].Pt5Line1_FamilyName[0]",
    "p5_parent1_legal_given_name": "form1[0].#subform[8].Pt5Line1_GivenName[0]",
    "p5_parent1_legal_middle_name": "form1[0].#subform[8].Pt5Line1_MiddleName[0]",
    "p5_parent1_birth_family_name": "form1[0].#subform[8].Pt5Line2_FamilyName[0]",
    "p5_parent1_birth_given_name": "form1[0].#subform[8].Pt5Line2_GivenName[0]",
    "p5_parent1_birth_middle_name": "form1[0].#subform[8].Pt5Line2_MiddleName[0]",
    "p5_parent1_dob": "form1[0].#subform[8].Pt5Line3_DateofBirth[0]",

    # ============================================
    # PAGE 10: Part 5 (Parent 1 Country & Parent 2) & Part 6 (Marital History & Current Spouse)
    # ============================================
    # Page 10 Header & Barcode
    "p10_barcode": "form1[0].#pageSet[0].Page1[9].PDF417BarCode2[0]",
    "p10_header_alien_number": "form1[0].#subform[9].AlienNumber[9]",

    # Part 5 Parent 1 Country of Birth
    "p5_parent1_country_of_birth": "form1[0].#subform[9].Pt5Line5_CityTownOfBirth[0]",

    # Part 5 Parent 2 Details
    "p5_parent2_legal_family_name": "form1[0].#subform[9].Pt5Line6_FamilyName[0]",
    "p5_parent2_legal_given_name": "form1[0].#subform[9].Pt5Line6_GivenName[0]",
    "p5_parent2_legal_middle_name": "form1[0].#subform[9].Pt5Line6_MiddleName[0]",
    "p5_parent2_birth_family_name": "form1[0].#subform[9].Pt5Line7_FamilyName[0]",
    "p5_parent2_birth_given_name": "form1[0].#subform[9].Pt5Line7_GivenName[0]",
    "p5_parent2_birth_middle_name": "form1[0].#subform[9].Pt5Line7_MiddleName[0]",
    "p5_parent2_dob": "form1[0].#subform[9].Pt5Line8_DateofBirth[0]",
    "p5_parent2_country_of_birth": "form1[0].#subform[9].Pt5Line10_CityTownOfBirth[0]",

    # Part 6 Item 1: Current Marital Status
    "p6_marital_single_cb": "form1[0].#subform[9].Pt6Line1_MaritalStatus[1]",
    "p6_marital_married_cb": "form1[0].#subform[9].Pt6Line1_MaritalStatus[3]",
    "p6_marital_divorced_cb": "form1[0].#subform[9].Pt6Line1_MaritalStatus[0]",
    "p6_marital_widowed_cb": "form1[0].#subform[9].Pt6Line1_MaritalStatus[2]",
    "p6_marital_annulled_cb": "form1[0].#subform[9].Pt6Line1_MaritalStatus[4]",
    "p6_marital_separated_cb": "form1[0].#subform[9].Pt6Line1_MaritalStatus[5]",

    # Part 6 Item 2: Spouse in Armed Forces / Coast Guard
    "p6_spouse_armed_forces_na_cb": "form1[0].#subform[9].Pt5Line2_YNNA[2]",
    "p6_spouse_armed_forces_yes_cb": "form1[0].#subform[9].Pt5Line2_YNNA[1]",
    "p6_spouse_armed_forces_no_cb": "form1[0].#subform[9].Pt5Line2_YNNA[0]",

    # Part 6 Item 3: Times Married
    "p6_times_married": "form1[0].#subform[9].Pt6Line3_TimesMarried[0]",

    # Part 6 Items 4-7: Current Spouse Details
    "p6_spouse_legal_family_name": "form1[0].#subform[9].Pt6Line4_FamilyName[0]",
    "p6_spouse_legal_given_name": "form1[0].#subform[9].Pt6Line4_GivenName[0]",
    "p6_spouse_legal_middle_name": "form1[0].#subform[9].Pt6Line4_MiddleName[0]",
    "p6_spouse_alien_number": "form1[0].#subform[9].Pt6Line5_AlienNumber[0]",
    "p6_spouse_dob": "form1[0].#subform[9].Pt5Line8_DateofBirth[1]",
    "p6_spouse_country_of_birth": "form1[0].#subform[9].Pt6Line7_Country[0]",

    # Part 6 Item 8: Current Spouse Physical Address
    "p6_spouse_phys_street": "form1[0].#subform[9].Part6Line8_StreetName[0]",
    "p6_spouse_phys_unit_apt": "form1[0].#subform[9].P6Line8_Unit[0]",
    "p6_spouse_phys_unit_ste": "form1[0].#subform[9].P6Line8_Unit[1]",
    "p6_spouse_phys_unit_flr": "form1[0].#subform[9].P6Line8_Unit[2]",
    "p6_spouse_phys_unit_val": "form1[0].#subform[9].P6Line8_Number[0]",
    "p6_spouse_phys_city": "form1[0].#subform[9].P6Line8_City[0]",
    "p6_spouse_phys_state": "form1[0].#subform[9].P6Line8_State[0]",
    "p6_spouse_phys_zip": "form1[0].#subform[9].P6Line8_ZipCode[0]",
    "p6_spouse_phys_province": "form1[0].#subform[9].P6Line8_Province[0]",
    "p6_spouse_phys_postal": "form1[0].#subform[9].P6Line8_PostalCode[0]",
    "p6_spouse_phys_country": "form1[0].#subform[9].P6Line8_Country[0]",

    # ============================================
    # PAGE 11: Part 6 (Current Marriage Details & Prior Marriage 1)
    # ============================================
    # Page 11 Header & Barcode
    "p11_barcode": "form1[0].#pageSet[0].Page1[10].PDF417BarCode2[0]",
    "p11_header_alien_number": "form1[0].#subform[10].AlienNumber[10]",

    # Part 6 Item 9: Place & Date of Marriage to Current Spouse
    "p6_current_marriage_city": "form1[0].#subform[10].Pt6Line10_CityTownOfBirth[0]",
    "p6_current_marriage_state_province": "form1[0].#subform[10].Pt6Line10_State[0]",
    "p6_current_marriage_country": "form1[0].#subform[10].Pt6Line10_Country[0]",
    "p6_current_marriage_date": "form1[0].#subform[10].Pt5Line8_DateofBirth[2]",

    # Part 6 Item 10: Current Spouse Applying With You
    "p6_current_spouse_applying_with_you_Yes": "form1[0].#subform[10].Pt6Line11_YN[1]",
    "p6_current_spouse_applying_with_you_No": "form1[0].#subform[10].Pt6Line11_YN[0]",

    # Information About Prior Marriages (Prior Spouse 1)
    # Item 11: Legal Name
    "p6_prior_spouse1_family_name": "form1[0].#subform[10].Pt6Line12_FamilyName[0]",
    "p6_prior_spouse1_given_name": "form1[0].#subform[10].Pt6Line12_GivenName[0]",
    "p6_prior_spouse1_middle_name": "form1[0].#subform[10].Pt6Line12_MiddleName[0]",

    # Item 12: Date of Birth
    "p6_prior_spouse1_dob": "form1[0].#subform[10].Pt5Line8_DateofBirth[3]",

    # Item 13 & 14: Country of Birth & Citizenship
    "p6_prior_spouse1_country_of_birth": "form1[0].#subform[10].Pt6Line14_Country[0]",
    "p6_prior_spouse1_citizenship": "form1[0].#subform[10].Pt6Line15_Country[0]",

    # Item 15: Date of Marriage
    "p6_prior_spouse1_marriage_date": "form1[0].#subform[10].Pt6Line16_DateofBirth[0]",

    # Item 16: Place of Marriage
    "p6_prior_spouse1_marriage_city": "form1[0].#subform[10].Pt6Line10_CityTownOfBirth[1]",
    "p6_prior_spouse1_marriage_state_province": "form1[0].#subform[10].Pt6Line10_State[1]",
    "p6_prior_spouse1_marriage_country": "form1[0].#subform[10].Pt6Line10_Country[1]",

    # Item 17: Place & Date Marriage Legally Ended
    "p6_prior_spouse1_ended_city": "form1[0].#subform[10].Pt6Line18_CityTownOfBirth[0]",
    "p6_prior_spouse1_ended_state_province": "form1[0].#subform[10].Pt6Line18_State[0]",
    "p6_prior_spouse1_ended_country": "form1[0].#subform[10].Pt6Line18_Country[0]",
    "p6_prior_spouse1_ended_date": "form1[0].#subform[10].Pt6Line16_DateofBirth[1]",

    # Item 18: How Marriage Ended
    "p6_prior_spouse1_how_ended_annulled_cb": "form1[0].#subform[10].Pt6Line19_MaritalStatus[1]",
    "p6_prior_spouse1_how_ended_divorced_cb": "form1[0].#subform[10].Pt6Line19_MaritalStatus[3]",
    "p6_prior_spouse1_how_ended_deceased_cb": "form1[0].#subform[10].Pt6Line19_MaritalStatus[0]",
    "p6_prior_spouse1_how_ended_other_cb": "form1[0].#subform[10].Pt6Line19_MaritalStatus[2]",
    "p6_prior_spouse1_how_ended_other_text": "form1[0].#subform[10].Pt6Line19_HowMarriageEndedOther[0]",

    # ============================================
    # PAGE 12: Part 7 (Information About Your Children)
    # ============================================
    # Page 12 Header & Barcode
    "p12_barcode": "form1[0].#pageSet[0].Page1[11].PDF417BarCode2[0]",
    "p12_header_alien_number": "form1[0].#subform[11].AlienNumber[11]",

    # Part 7 Item 1: Total Children Count
    "p7_total_children_count": "form1[0].#subform[11].Pt6Line1_TotalChildren[0]",

    # Part 7 Item 2: Child 1 Details
    "p7_child1_family_name": "form1[0].#subform[11].Pt7Line2_FamilyName[0]",
    "p7_child1_given_name": "form1[0].#subform[11].Pt7Line2_GivenName[0]",
    "p7_child1_middle_name": "form1[0].#subform[11].Pt7Line2_MiddleName[0]",
    "p7_child1_alien_number": "form1[0].#subform[11].Pt7Line2_AlienNumber[0]",
    "p7_child1_dob": "form1[0].#subform[11].Pt7Line2_DateofBirth[0]",
    "p7_child1_country_of_birth": "form1[0].#subform[11].Pt7Line2_Country[0]",
    "p7_child1_relationship": "form1[0].#subform[11].Pt7Line2_Relationship[0]",
    "p7_child1_applying_with_you_Yes": "form1[0].#subform[11].Pt7Line2_YN[1]",
    "p7_child1_applying_with_you_No": "form1[0].#subform[11].Pt7Line2_YN[0]",

    # Part 7 Item 3: Child 2 Details
    "p7_child2_family_name": "form1[0].#subform[11].Pt7Line3_FamilyName[0]",
    "p7_child2_given_name": "form1[0].#subform[11].Pt7Line3_GivenName[0]",
    "p7_child2_middle_name": "form1[0].#subform[11].Pt7Line3_MiddleName[0]",
    "p7_child2_alien_number": "form1[0].#subform[11].Pt7Line3_AlienNumber[0]",
    "p7_child2_dob": "form1[0].#subform[11].Pt7Line3_DateofBirth[0]",
    "p7_child2_country_of_birth": "form1[0].#subform[11].Pt7Line3_Country[0]",
    "p7_child2_relationship": "form1[0].#subform[11].Pt7Line3_Relationship[0]",
    "p7_child2_applying_with_you_Yes": "form1[0].#subform[11].Pt7Line3_YN[1]",
    "p7_child2_applying_with_you_No": "form1[0].#subform[11].Pt7Line3_YN[0]",

    # ============================================
    # PAGE 13: Part 8 (Biographic Info) & Part 9 (Eligibility & Organizations 1 & 2)
    # ============================================
    # Page 13 Header & Barcode
    "p13_barcode": "form1[0].#pageSet[0].Page1[12].PDF417BarCode2[0]",
    "p13_header_alien_number": "form1[0].#subform[12].AlienNumber[12]",

    # Part 8 Item 1: Ethnicity
    "p8_ethnicity_hispanic_cb": "form1[0].#subform[12].Pt7Line1_Ethnicity[0]",
    "p8_ethnicity_not_hispanic_cb": "form1[0].#subform[12].Pt7Line1_Ethnicity[1]",

    # Part 8 Item 2: Race (5 Checkboxes)
    "p8_race_american_indian_cb": "form1[0].#subform[12].Pt7Line2_Race[3]",
    "p8_race_asian_cb": "form1[0].#subform[12].Pt7Line2_Race[0]",
    "p8_race_black_cb": "form1[0].#subform[12].Pt7Line2_Race[2]",
    "p8_race_hawaiian_cb": "form1[0].#subform[12].Pt7Line2_Race[4]",
    "p8_race_white_cb": "form1[0].#subform[12].Pt7Line2_Race[1]",

    # Part 8 Item 3 & 4: Height & Weight
    "p8_height_feet": "form1[0].#subform[12].Pt7Line3_HeightFeet[0]",
    "p8_height_inches": "form1[0].#subform[12].Pt7Line3_HeightInches[0]",
    "p8_weight_digit1": "form1[0].#subform[12].Pt7Line4_Weight1[0]",
    "p8_weight_digit2": "form1[0].#subform[12].Pt7Line4_Weight2[0]",
    "p8_weight_digit3": "form1[0].#subform[12].Pt7Line4_Weight3[0]",

    # Part 8 Item 5: Eye Color (9 Checkboxes)
    "p8_eye_black_cb": "form1[0].#subform[12].Pt7Line5_Eyecolor[1]",
    "p8_eye_blue_cb": "form1[0].#subform[12].Pt7Line5_Eyecolor[0]",
    "p8_eye_brown_cb": "form1[0].#subform[12].Pt7Line5_Eyecolor[2]",
    "p8_eye_gray_cb": "form1[0].#subform[12].Pt7Line5_Eyecolor[3]",
    "p8_eye_green_cb": "form1[0].#subform[12].Pt7Line5_Eyecolor[4]",
    "p8_eye_hazel_cb": "form1[0].#subform[12].Pt7Line5_Eyecolor[5]",
    "p8_eye_maroon_cb": "form1[0].#subform[12].Pt7Line5_Eyecolor[6]",
    "p8_eye_pink_cb": "form1[0].#subform[12].Pt7Line5_Eyecolor[7]",
    "p8_eye_other_cb": "form1[0].#subform[12].Pt7Line5_Eyecolor[8]",

    # Part 8 Item 6: Hair Color (9 Checkboxes)
    "p8_hair_bald_cb": "form1[0].#subform[12].Pt7Line6_Haircolor[0]",
    "p8_hair_black_cb": "form1[0].#subform[12].Pt7Line6_Haircolor[1]",
    "p8_hair_blond_cb": "form1[0].#subform[12].Pt7Line6_Haircolor[2]",
    "p8_hair_brown_cb": "form1[0].#subform[12].Pt7Line6_Haircolor[3]",
    "p8_hair_gray_cb": "form1[0].#subform[12].Pt7Line6_Haircolor[4]",
    "p8_hair_red_cb": "form1[0].#subform[12].Pt7Line6_Haircolor[5]",
    "p8_hair_sandy_cb": "form1[0].#subform[12].Pt7Line6_Haircolor[6]",
    "p8_hair_white_cb": "form1[0].#subform[12].Pt7Line6_Haircolor[7]",
    "p8_hair_other_cb": "form1[0].#subform[12].Pt7Line6_Haircolor[8]",

    # Part 9 Item 1: Member of Organizations
    "p9_associated_organizations_Yes": "form1[0].#subform[12].Pt8Line1_YesNo[1]",
    "p9_associated_organizations_No": "form1[0].#subform[12].Pt8Line1_YesNo[0]",

    # Part 9 Items 2-5: Organization 1
    "p9_org1_name": "form1[0].#subform[12].Pt9Line2_Organization1[0]",
    "p9_org1_city": "form1[0].#subform[12].Pt9Line3_CityTownOfBirth[0]",
    "p9_org1_state_province": "form1[0].#subform[12].Pt9Line3_State[0]",
    "p9_org1_country": "form1[0].#subform[12].Pt9Line3_Country[0]",
    "p9_org1_nature": "form1[0].#subform[12].Pt9Line4_FamilyName[0]",
    "p9_org1_involvement": "form1[0].#subform[12].Pt9Line4_Involvement[0]",
    "p9_org1_date_from": "form1[0].#subform[12].Pt9Line5_DateFrom[0]",
    "p9_org1_date_to": "form1[0].#subform[12].Pt9Line5_DateTo[0]",

    # Part 9 Item 6: Organization 2 Name
    "p9_org2_name": "form1[0].#subform[12].Pt9Line6_Organization2[0]",

    # ============================================
    # PAGE 14: Part 9 (Organization 2 Details & Items 10-22 Eligibility Questions)
    # ============================================
    # Page 14 Header & Barcode
    "p14_barcode": "form1[0].#pageSet[0].Page1[13].PDF417BarCode2[0]",
    "p14_header_alien_number": "form1[0].#subform[13].AlienNumber[13]",

    # Part 9 Organization 2 Details (Items 7-9)
    "p9_org2_city": "form1[0].#subform[13].Pt9Line7_CityTownOfBirth[0]",
    "p9_org2_state_province": "form1[0].#subform[13].Pt9Line7_State[0]",
    "p9_org2_country": "form1[0].#subform[13].Pt9Line7_Country[0]",
    "p9_org2_nature": "form1[0].#subform[13].Pt9Line8_FamilyName[0]",
    "p9_org2_involvement": "form1[0].#subform[13].Pt9Line8_Involvement[0]",
    "p9_org2_date_from": "form1[0].#subform[13].Pt9Line9_DateFrom[0]",
    "p9_org2_date_to": "form1[0].#subform[13].Pt9Line9_DateTo[0]",

    # Part 9 Item 10: Denied admission to US
    "p9_denied_admission_Yes": "form1[0].#subform[13].Pt9Line10_YesNo[1]",
    "p9_denied_admission_No": "form1[0].#subform[13].Pt9Line10_YesNo[0]",

    # Part 9 Item 11: Denied US visa
    "p9_denied_visa_Yes": "form1[0].#subform[13].Pt9Line11_YesNo[0]",
    "p9_denied_visa_No": "form1[0].#subform[13].Pt9Line11_YesNo[1]",

    # Part 9 Item 12: Worked without authorization
    "p9_worked_unauthorized_Yes": "form1[0].#subform[13].Pt9Line12_YesNo[0]",
    "p9_worked_unauthorized_No": "form1[0].#subform[13].Pt9Line12_YesNo[1]",

    # Part 9 Item 13: Violated status terms
    "p9_violated_status_terms_Yes": "form1[0].#subform[13].Pt8Line13_YesNo[1]",
    "p9_violated_status_terms_No": "form1[0].#subform[13].Pt8Line13_YesNo[0]",

    # Part 9 Item 14: In deportation/removal proceedings
    "p9_in_deportation_proceedings_Yes": "form1[0].#subform[13].Pt8Line18_YesNo[0]",
    "p9_in_deportation_proceedings_No": "form1[0].#subform[13].Pt8Line18_YesNo[1]",

    # Part 9 Item 15: Final order of deportation/removal
    "p9_final_order_deportation_Yes": "form1[0].#subform[13].Pt8Line19_YesNo[1]",
    "p9_final_order_deportation_No": "form1[0].#subform[13].Pt8Line19_YesNo[0]",

    # Part 9 Item 16: Prior order reinstated
    "p9_order_reinstated_Yes": "form1[0].#subform[13].Pt8Line20_YesNo[0]",
    "p9_order_reinstated_No": "form1[0].#subform[13].Pt8Line20_YesNo[1]",

    # Part 9 Item 17: Failed voluntary departure
    "p9_failed_voluntary_departure_Yes": "form1[0].#subform[13].Pt8Line17_YesNo[0]",
    "p9_failed_voluntary_departure_No": "form1[0].#subform[13].Pt8Line17_YesNo[1]",

    # Part 9 Item 18: Applied for deportation relief
    "p9_applied_deportation_relief_Yes": "form1[0].#subform[13].Pt8Line23_YesNo[1]",
    "p9_applied_deportation_relief_No": "form1[0].#subform[13].Pt8Line23_YesNo[0]",

    # Part 9 Item 19: J exchange visitor 2-year foreign residence rule
    "p9_j_exchange_subject_2yr_Yes": "form1[0].#subform[13].Pt8Line24a_YesNo[0]",
    "p9_j_exchange_subject_2yr_No": "form1[0].#subform[13].Pt8Line24a_YesNo[1]",

    # Part 9 Item 20: Complied with 2-year foreign residence rule
    "p9_j_exchange_complied_2yr_Yes": "form1[0].#subform[13].Pt8Line24b_YesNo[1]",
    "p9_j_exchange_complied_2yr_No": "form1[0].#subform[13].Pt8Line24b_YesNo[0]",

    # Part 9 Item 21: J exchange waiver granted
    "p9_j_exchange_waiver_granted_Yes": "form1[0].#subform[13].Pt8Line24c_YesNo[0]",
    "p9_j_exchange_waiver_granted_No": "form1[0].#subform[13].Pt8Line24c_YesNo[1]",

    # Part 9 Item 22: Arrested, cited, charged, or diversion program
    "p9_arrested_cited_charged_Yes": "form1[0].#subform[13].Pt8Line22_YesNo[0]",
    "p9_arrested_cited_charged_No": "form1[0].#subform[13].Pt8Line22_YesNo[1]",

    # ============================================
    # PAGE 15: Part 9 (Items 23-37 Criminal & Inadmissibility Grounds)
    # ============================================
    # Page 15 Header & Barcode
    "p15_barcode": "form1[0].#pageSet[0].Page1[14].PDF417BarCode2[0]",
    "p15_header_alien_number": "form1[0].#subform[14].AlienNumber[14]",

    # Part 9 Item 23: Committed crime
    "p9_committed_crime_Yes": "form1[0].#subform[14].Pt9Line23_YesNo[1]",
    "p9_committed_crime_No": "form1[0].#subform[14].Pt9Line23_YesNo[0]",

    # Part 9 Item 24: Pled guilty / convicted
    "p9_pled_guilty_convicted_Yes": "form1[0].#subform[14].Pt9Line24_YesNo[0]",
    "p9_pled_guilty_convicted_No": "form1[0].#subform[14].Pt9Line24_YesNo[1]",

    # Part 9 Item 25: Punished by judge / liberty restrained
    "p9_punished_by_judge_Yes": "form1[0].#subform[14].Pt8Line25_YesNo[1]",
    "p9_punished_by_judge_No": "form1[0].#subform[14].Pt8Line25_YesNo[0]",

    # Part 9 Item 26: Violated controlled substance law
    "p9_violated_controlled_substance_Yes": "form1[0].#subform[14].Pt8Line26_YesNo[1]",
    "p9_violated_controlled_substance_No": "form1[0].#subform[14].Pt8Line26_YesNo[0]",

    # Part 9 Item 27: Trafficked controlled substance
    "p9_trafficked_controlled_substance_Yes": "form1[0].#subform[14].Pt8Line27_YesNo[1]",
    "p9_trafficked_controlled_substance_No": "form1[0].#subform[14].Pt8Line27_YesNo[0]",

    # Part 9 Item 28: Trafficker relative financial benefit
    "p9_trafficker_relative_benefit_Yes": "form1[0].#subform[14].Pt8Line28_YesNo[1]",
    "p9_trafficker_relative_benefit_No": "form1[0].#subform[14].Pt8Line28_YesNo[0]",

    # Part 9 Item 29: Knew benefit resulted from trafficking
    "p9_knew_benefit_trafficking_Yes": "form1[0].#subform[14].Pt8Line29_YesNo[1]",
    "p9_knew_benefit_trafficking_No": "form1[0].#subform[14].Pt8Line29_YesNo[0]",

    # Part 9 Item 30: Engaged in prostitution
    "p9_engaged_prostitution_Yes": "form1[0].#subform[14].Pt8Line30_YesNo[1]",
    "p9_engaged_prostitution_No": "form1[0].#subform[14].Pt8Line30_YesNo[0]",

    # Part 9 Item 31: Procured prostitutes
    "p9_procured_prostitutes_Yes": "form1[0].#subform[14].Pt8Line31_YesNo[0]",
    "p9_procured_prostitutes_No": "form1[0].#subform[14].Pt8Line31_YesNo[1]",

    # Part 9 Item 32: Received prostitution proceeds
    "p9_received_prostitution_proceeds_Yes": "form1[0].#subform[14].Pt8Line32_YesNo[0]",
    "p9_received_prostitution_proceeds_No": "form1[0].#subform[14].Pt8Line32_YesNo[1]",

    # Part 9 Item 33: Intend illegal gambling or commercialized vice
    "p9_intend_illegal_vice_Yes": "form1[0].#subform[14].Pt8Line33_YesNo[0]",
    "p9_intend_illegal_vice_No": "form1[0].#subform[14].Pt8Line33_YesNo[1]",

    # Part 9 Item 34: Exercised diplomatic immunity
    "p9_exercised_immunity_Yes": "form1[0].#subform[14].Pt8Line34_YesNo[1]",
    "p9_exercised_immunity_No": "form1[0].#subform[14].Pt8Line34_YesNo[0]",

    # Part 9 Item 35.a: Served as foreign government official
    "p9_foreign_govt_official_Yes": "form1[0].#subform[14].Pt8Line35a_YesNo[0]",
    "p9_foreign_govt_official_No": "form1[0].#subform[14].Pt8Line35a_YesNo[1]",

    # Part 9 Item 35.b: Religious freedom violations
    "p9_religious_freedom_violations_Yes": "form1[0].#subform[14].Pt8Line35b_YesNo[1]",
    "p9_religious_freedom_violations_No": "form1[0].#subform[14].Pt8Line35b_YesNo[0]",

    # Part 9 Item 36: Sex trafficking
    "p9_sex_trafficking_Yes": "form1[0].#subform[14].Pt8Line36_YesNo[1]",
    "p9_sex_trafficking_No": "form1[0].#subform[14].Pt8Line36_YesNo[0]",

    # Part 9 Item 37: Involuntary servitude or slavery
    "p9_involuntary_servitude_slavery_Yes": "form1[0].#subform[14].Pt8Line37_YesNo[1]",
    "p9_involuntary_servitude_slavery_No": "form1[0].#subform[14].Pt8Line37_YesNo[0]",

    # ============================================
    # PAGE 16: Part 9 (Items 38-45 Inadmissibility, Security & Violence Grounds)
    # ============================================
    # Page 16 Header & Barcode
    "p16_barcode": "form1[0].#pageSet[0].Page1[15].PDF417BarCode2[0]",
    "p16_header_alien_number": "form1[0].#subform[15].AlienNumber[15]",

    # Part 9 Item 38: Aided/assisted trafficking in persons
    "p9_assisted_trafficking_persons_Yes": "form1[0].#subform[15].Pt8Line38_YesNo[0]",
    "p9_assisted_trafficking_persons_No": "form1[0].#subform[15].Pt8Line38_YesNo[1]",

    # Part 9 Item 39: Human trafficker relative financial benefit
    "p9_human_trafficker_relative_benefit_Yes": "form1[0].#subform[15].Pt9Line39_YesNo[1]",
    "p9_human_trafficker_relative_benefit_No": "form1[0].#subform[15].Pt9Line39_YesNo[0]",

    # Part 9 Item 40: Knew benefit from human trafficking
    "p9_knew_benefit_human_trafficking_Yes": "form1[0].#subform[15].Pt8Line40_YesNo[1]",
    "p9_knew_benefit_human_trafficking_No": "form1[0].#subform[15].Pt8Line40_YesNo[0]",

    # Part 9 Item 41: Money laundering
    "p9_money_laundering_Yes": "form1[0].#subform[15].Pt8Line41_YesNo[0]",
    "p9_money_laundering_No": "form1[0].#subform[15].Pt8Line41_YesNo[1]",

    # Part 9 Security Items 42.a - 42.d
    "p9_espionage_sabotage_Yes": "form1[0].#subform[15].Pt8Line42.a_YesNo[0]",
    "p9_espionage_sabotage_No": "form1[0].#subform[15].Pt8Line42.a_YesNo[1]",
    "p9_export_laws_violation_Yes": "form1[0].#subform[15].Pt8Line42.b_YesNo[1]",
    "p9_export_laws_violation_No": "form1[0].#subform[15].Pt8Line42.b_YesNo[0]",
    "p9_overthrow_govt_force_Yes": "form1[0].#subform[15].Pt8Line42c_YesNo[1]",
    "p9_overthrow_govt_force_No": "form1[0].#subform[15].Pt8Line42c_YesNo[0]",
    "p9_other_unlawful_activity_Yes": "form1[0].#subform[15].Pt8Line42d_YesNo[0]",
    "p9_other_unlawful_activity_No": "form1[0].#subform[15].Pt8Line42d_YesNo[1]",

    # Part 9 Items 43.a - 43.i Weapons, Violence & Support
    "p9_weapons_paramilitary_training_Yes": "form1[0].#subform[15].Pt8Line43a_YesNo[1]",
    "p9_weapons_paramilitary_training_No": "form1[0].#subform[15].Pt8Line43a_YesNo[0]",
    "p9_kidnapping_assassination_hijacking_Yes": "form1[0].#subform[15].Pt8Line43b_YesNo[0]",
    "p9_kidnapping_assassination_hijacking_No": "form1[0].#subform[15].Pt8Line43b_YesNo[1]",
    "p9_used_weapon_explosive_danger_Yes": "form1[0].#subform[15].Pt8Line43c_YesNo[0]",
    "p9_used_weapon_explosive_danger_No": "form1[0].#subform[15].Pt8Line43c_YesNo[1]",
    "p9_planned_kidnapping_weapon_acts_Yes": "form1[0].#subform[15].Pt8Line43d_YesNo[0]",
    "p9_planned_kidnapping_weapon_acts_No": "form1[0].#subform[15].Pt8Line43d_YesNo[1]",
    "p9_incited_death_harm_acts_Yes": "form1[0].#subform[15].Pt8Line43e_YesNo[0]",
    "p9_incited_death_harm_acts_No": "form1[0].#subform[15].Pt8Line43e_YesNo[1]",
    "p9_member_group_violent_acts_Yes": "form1[0].#subform[15].Pt8Line43fYesNo[0]",
    "p9_member_group_violent_acts_No": "form1[0].#subform[15].Pt8Line43fYesNo[1]",
    "p9_recruited_solicited_violent_group_Yes": "form1[0].#subform[15].Pt8Line43g_YesNo[0]",
    "p9_recruited_solicited_violent_group_No": "form1[0].#subform[15].Pt8Line43g_YesNo[1]",
    "p9_provided_support_violent_activities_Yes": "form1[0].#subform[15].Pt8Line43h_YesNo[1]",
    "p9_provided_support_violent_activities_No": "form1[0].#subform[15].Pt8Line43h_YesNo[0]",
    "p9_provided_support_violent_group_Yes": "form1[0].#subform[15].Pt8Line43i_YesNo[1]",
    "p9_provided_support_violent_group_No": "form1[0].#subform[15].Pt8Line43i_YesNo[0]",

    # Part 9 Items 44 & 45
    "p9_intend_violent_acts_Yes": "form1[0].#subform[15].Pt8Line44_YesNo[0]",
    "p9_intend_violent_acts_No": "form1[0].#subform[15].Pt8Line44_YesNo[1]",
    "p9_endanger_us_security_Yes": "form1[0].#subform[15].Pt8Line45_YesNo[1]",
    "p9_endanger_us_security_No": "form1[0].#subform[15].Pt8Line45_YesNo[0]",

    # ============================================
    # PAGE 17: Part 9 (Items 46-55 Military, Genocide, Child Soldiers & Political Inadmissibility Grounds)
    # ============================================
    # Page 17 Header & Barcode
    "p17_barcode": "form1[0].#pageSet[0].Page1[16].PDF417BarCode2[0]",
    "p17_header_alien_number": "form1[0].#subform[16].AlienNumber[16]",

    # Part 9 Item 46: Spouse/child of violent person
    "p9_spouse_child_violent_person_Yes": "form1[0].#subform[16].Pt8Line46_YesNo[0]",
    "p9_spouse_child_violent_person_No": "form1[0].#subform[16].Pt8Line46_YesNo[1]",

    # Part 9 Item 47: Sold/transported weapons
    "p9_sold_transported_weapons_Yes": "form1[0].#subform[16].Pt8Line47_YesNo[1]",
    "p9_sold_transported_weapons_No": "form1[0].#subform[16].Pt8Line47_YesNo[0]",

    # Part 9 Item 48: Worked in prison/detention facility
    "p9_worked_prison_detention_Yes": "form1[0].#subform[16].Pt8Line48_YesNo[1]",
    "p9_worked_prison_detention_No": "form1[0].#subform[16].Pt8Line48_YesNo[0]",

    # Part 9 Item 49: Member of group using weapons
    "p9_group_used_weapons_Yes": "form1[0].#subform[16].Pt8Line49_YesNo[0]",
    "p9_group_used_weapons_No": "form1[0].#subform[16].Pt8Line49_YesNo[1]",

    # Part 9 Item 50: Served in military or police
    "p9_served_military_police_Yes": "form1[0].#subform[16].Pt8Line50_YesNo[1]",
    "p9_served_military_police_No": "form1[0].#subform[16].Pt8Line50_YesNo[0]",

    # Part 9 Item 51: Served in armed rebel/paramilitary group
    "p9_served_armed_rebel_group_Yes": "form1[0].#subform[16].Pt8Line51_YesNo[0]",
    "p9_served_armed_rebel_group_No": "form1[0].#subform[16].Pt8Line51_YesNo[1]",

    # Part 9 Item 52: Communist Party or totalitarian party
    "p9_communist_totalitarian_party_Yes": "form1[0].#subform[16].Pt8Line52_YesNo[1]",
    "p9_communist_totalitarian_party_No": "form1[0].#subform[16].Pt8Line52_YesNo[0]",

    # Part 9 Items 53.a - 53.d: Torture, Genocide, Killing, Injuring
    "p9_torture_Yes": "form1[0].#subform[16].Pt8Line53a_YesNo[0]",
    "p9_torture_No": "form1[0].#subform[16].Pt8Line53a_YesNo[1]",
    "p9_genocide_Yes": "form1[0].#subform[16].Pt8Line53b_YesNo[0]",
    "p9_genocide_No": "form1[0].#subform[16].Pt8Line53b_YesNo[1]",
    "p9_killing_trying_kill_Yes": "form1[0].#subform[16].Pt8Line53c_YesNo[0]",
    "p9_killing_trying_kill_No": "form1[0].#subform[16].Pt8Line53c_YesNo[1]",
    "p9_severely_injuring_person_Yes": "form1[0].#subform[16].Pt8Line53d_YesNo[1]",
    "p9_severely_injuring_person_No": "form1[0].#subform[16].Pt8Line53d_YesNo[0]",

    # Part 9 Item 54 & 55: Child soldiers (under 15 years old)
    "p9_child_soldiers_under15_recruited_Yes": "form1[0].#subform[16].Pt8Line54_YesNo[1]",
    "p9_child_soldiers_under15_recruited_No": "form1[0].#subform[16].Pt8Line54_YesNo[0]",
    "p9_child_soldiers_under15_used_Yes": "form1[0].#subform[16].Pt8Line55_YesNo[0]",
    "p9_child_soldiers_under15_used_No": "form1[0].#subform[16].Pt8Line55_YesNo[1]",

    # ============================================
    # PAGE 18: Part 9 Public Charge Exemptions (Item 56: Checkboxes 0-21)
    # ============================================
    # Page 18 Header & Barcode
    "p18_barcode": "form1[0].#pageSet[0].Page1[17].PDF417BarCode2[0]",
    "p18_header_alien_number": "form1[0].#subform[17].AlienNumber[17]",

    # Part 9 Item 56: Public Charge Exemptions (22 Checkboxes)
    "p9_public_charge_vawa_cb": "form1[0].#subform[17].Pt9Line56_CB[5]",
    "p9_public_charge_sij_cb": "form1[0].#subform[17].Pt9Line56_CB[6]",
    "p9_public_charge_afghan_iraqi_cb": "form1[0].#subform[17].Pt9Line56_CB[0]",
    "p9_public_charge_asylee_cb": "form1[0].#subform[17].Pt9Line56_CB[3]",
    "p9_public_charge_refugee_cb": "form1[0].#subform[17].Pt9Line56_CB[1]",
    "p9_public_charge_u_visa_cb": "form1[0].#subform[17].Pt9Line56_CB[2]",
    "p9_public_charge_u_status_valid_cb": "form1[0].#subform[17].Pt9Line56_CB[4]",
    "p9_public_charge_t_visa_cb": "form1[0].#subform[17].Pt9Line56_CB[9]",
    "p9_public_charge_t_status_valid_cb": "form1[0].#subform[17].Pt9Line56_CB[12]",
    "p9_public_charge_cuban_act_cb": "form1[0].#subform[17].Pt9Line56_CB[7]",
    "p9_public_charge_cuban_battered_cb": "form1[0].#subform[17].Pt9Line56_CB[10]",
    "p9_public_charge_haitian_cb": "form1[0].#subform[17].Pt9Line56_CB[11]",
    "p9_public_charge_haitian_battered_cb": "form1[0].#subform[17].Pt9Line56_CB[8]",
    "p9_public_charge_cuban_haitian_entrants_cb": "form1[0].#subform[17].Pt9Line56_CB[17]",
    "p9_public_charge_lautenberg_cb": "form1[0].#subform[17].Pt9Line56_CB[18]",
    "p9_public_charge_indochinese_cb": "form1[0].#subform[17].Pt9Line56_CB[19]",
    "p9_public_charge_registry_1972_cb": "form1[0].#subform[17].Pt9Line56_CB[13]",
    "p9_public_charge_amerasian_cb": "form1[0].#subform[17].Pt9Line56_CB[15]",
    "p9_public_charge_polish_hungarian_cb": "form1[0].#subform[17].Pt9Line56_CB[16]",
    "p9_public_charge_nacara_cb": "form1[0].#subform[17].Pt9Line56_CB[14]",
    "p9_public_charge_american_indian_kickapoo_cb": "form1[0].#subform[17].Pt9Line56_CB[20]",
    "p9_public_charge_liberian_cb": "form1[0].#subform[17].Pt9Line56_CB[21]",

    # ============================================
    # PAGE 19: Part 9 Public Charge Details (Items 56 continuation & 57-64)
    # ============================================
    # Page 19 Header & Barcode
    "p19_barcode": "form1[0].#pageSet[0].Page1[18].PDF417BarCode2[0]",
    "p19_header_alien_number": "form1[0].#subform[18].AlienNumber[18]",

    # Part 9 Item 56 Continuation (Checkboxes 22, 23, 24)
    "p9_public_charge_syrian_cb": "form1[0].#subform[18].Pt9Line56_CB[22]",
    "p9_public_charge_active_duty_relative_cb": "form1[0].#subform[18].Pt9Line56_CB[23]",
    "p9_public_charge_not_exempt_cb": "form1[0].#subform[18].Pt9Line56_CB[24]",

    # Part 9 Item 57: Household Size
    "p9_household_size": "form1[0].#subform[18].Pt9Line57_HouseholdSize[0]",

    # Part 9 Item 58: Annual Household Income Checkboxes (0-4)
    "p9_income_0_27k_cb": "form1[0].#subform[18].Pt9Line53_CB[0]",
    "p9_income_27k_52k_cb": "form1[0].#subform[18].Pt9Line53_CB[1]",
    "p9_income_52k_85k_cb": "form1[0].#subform[18].Pt9Line53_CB[2]",
    "p9_income_85k_141k_cb": "form1[0].#subform[18].Pt9Line53_CB[3]",
    "p9_income_over_141k_cb": "form1[0].#subform[18].Pt9Line53_CB[4]",

    # Part 9 Item 59: Household Assets Checkboxes (0-4)
    "p9_assets_0_18k_cb": "form1[0].#subform[18].Pt9Line59_CB[0]",
    "p9_assets_18k_136k_cb": "form1[0].#subform[18].Pt9Line59_CB[1]",
    "p9_assets_136k_321k_cb": "form1[0].#subform[18].Pt9Line59_CB[2]",
    "p9_assets_321k_707k_cb": "form1[0].#subform[18].Pt9Line59_CB[3]",
    "p9_assets_over_707k_cb": "form1[0].#subform[18].Pt9Line59_CB[4]",

    # Part 9 Item 60: Household Liabilities Checkboxes (0-4)
    "p9_liabilities_0_cb": "form1[0].#subform[18].Pt9Line60_CB[0]",
    "p9_liabilities_1_10k_cb": "form1[0].#subform[18].Pt9Line60_CB[1]",
    "p9_liabilities_10k_57k_cb": "form1[0].#subform[18].Pt9Line60_CB[2]",
    "p9_liabilities_57k_186k_cb": "form1[0].#subform[18].Pt9Line60_CB[3]",
    "p9_liabilities_over_186k_cb": "form1[0].#subform[18].Pt9Line60_CB[4]",

    # Part 9 Item 61: Education Level (Checkboxes 0-7 + Grade Text)
    "p9_edu_less_than_high_school_cb": "form1[0].#subform[18].Pt9Line61_CB[0]",
    "p9_edu_highest_grade_text": "form1[0].#subform[18].Pt9Line61_diploma[0]",
    "p9_edu_high_school_ged_cb": "form1[0].#subform[18].Pt9Line61_CB[2]",
    "p9_edu_some_college_cb": "form1[0].#subform[18].Pt9Line61_CB[7]",
    "p9_edu_associates_cb": "form1[0].#subform[18].Pt9Line61_CB[4]",
    "p9_edu_bachelors_cb": "form1[0].#subform[18].Pt9Line61_CB[5]",
    "p9_edu_masters_cb": "form1[0].#subform[18].Pt9Line61_CB[1]",
    "p9_edu_professional_cb": "form1[0].#subform[18].Pt9Line61_CB[3]",
    "p9_edu_doctorate_cb": "form1[0].#subform[18].Pt9Line61_CB[6]",

    # Part 9 Item 62: Occupational Certifications / Licenses / Skills (8 Table Rows)
    "p9_certifications_row1": "form1[0].#subform[18].Table1[0].Row1[0].TextField1[0]",
    "p9_certifications_row2": "form1[0].#subform[18].Table1[0].Row2[0].TextField2[0]",
    "p9_certifications_row3": "form1[0].#subform[18].Table1[0].Row3[0].TextField3[0]",
    "p9_certifications_row4": "form1[0].#subform[18].Table1[0].Row4[0].TextField4[0]",
    "p9_certifications_row5": "form1[0].#subform[18].Table1[0].Row5[0].TextField5[0]",
    "p9_certifications_row6": "form1[0].#subform[18].Table1[0].Row6[0].TextField6[0]",
    "p9_certifications_row7": "form1[0].#subform[18].Table1[0].Row7[0].TextField7[0]",
    "p9_certifications_row8": "form1[0].#subform[18].Table1[0].Row8[0].TextField8[0]",

    # Part 9 Item 63 & 64: Public Benefits (SSI/TANF/Cash Assistance & Institutionalization)
    "p9_public_cash_assistance_Yes": "form1[0].#subform[18].Pt9Line63_YesNo[0]",
    "p9_public_cash_assistance_No": "form1[0].#subform[18].Pt9Line63_YesNo[1]",
    "p9_institutional_care_govt_Yes": "form1[0].#subform[18].Pt9Line64_YesNo[0]",
    "p9_institutional_care_govt_No": "form1[0].#subform[18].Pt9Line64_YesNo[1]",

    # ============================================
    # PAGE 20: Part 9 Public Charge Details (Items 65-66 Tables) & Illegal Entries / Removal Grounds (Items 67-75)
    # ============================================
    # Page 20 Header & Barcode
    "p20_barcode": "form1[0].#pageSet[0].Page1[19].PDF417BarCode2[0]",
    "p20_header_alien_number": "form1[0].#subform[20].AlienNumber[19]",

    # Part 9 Item 65: Cash Benefits Received Details Table (4 Rows)
    "p9_cash_benefit_row1_name": "form1[0].#subform[20].Pt8Line68c_Column1Row1[0]",
    "p9_cash_benefit_row1_start_date": "form1[0].#subform[20].Pt8Line68c_Column2Row1[0]",
    "p9_cash_benefit_row1_end_date": "form1[0].#subform[20].Pt8Line68c_Column3Row1[0]",
    "p9_cash_benefit_row1_amount": "form1[0].#subform[20].Pt8Line68c_Column4Row1[0]",
    "p9_cash_benefit_row1_exempt_Yes": "form1[0].#subform[20].Pt9Line65_Row1_YesNo[0]",
    "p9_cash_benefit_row1_exempt_No": "form1[0].#subform[20].Pt9Line65_Row1_YesNo[1]",

    "p9_cash_benefit_row2_name": "form1[0].#subform[20].Pt8Line68c_Column1Row2[0]",
    "p9_cash_benefit_row2_start_date": "form1[0].#subform[20].Pt8Line68c_Column2Row2[0]",
    "p9_cash_benefit_row2_end_date": "form1[0].#subform[20].Pt8Line68c_Column3Row2[0]",
    "p9_cash_benefit_row2_amount": "form1[0].#subform[20].Pt8Line68c_Column4Row2[0]",
    "p9_cash_benefit_row2_exempt_Yes": "form1[0].#subform[20].Pt9Line65_Row2_YesNo[0]",
    "p9_cash_benefit_row2_exempt_No": "form1[0].#subform[20].Pt9Line65_Row2_YesNo[1]",

    "p9_cash_benefit_row3_name": "form1[0].#subform[20].Pt8Line68c_Column1Row3[0]",
    "p9_cash_benefit_row3_start_date": "form1[0].#subform[20].Pt8Line68c_Column2Row3[0]",
    "p9_cash_benefit_row3_end_date": "form1[0].#subform[20].Pt8Line68c_Column3Row3[0]",
    "p9_cash_benefit_row3_amount": "form1[0].#subform[20].Pt8Line68c_Column4Row3[0]",
    "p9_cash_benefit_row3_exempt_Yes": "form1[0].#subform[20].Pt9Line65_Row3_YesNo[0]",
    "p9_cash_benefit_row3_exempt_No": "form1[0].#subform[20].Pt9Line65_Row3_YesNo[1]",

    "p9_cash_benefit_row4_name": "form1[0].#subform[20].Pt8Line68c_Column1Row4[0]",
    "p9_cash_benefit_row4_start_date": "form1[0].#subform[20].Pt8Line68c_Column2Row4[0]",
    "p9_cash_benefit_row4_end_date": "form1[0].#subform[20].Pt8Line68c_Column3Row4[0]",
    "p9_cash_benefit_row4_amount": "form1[0].#subform[20].Pt8Line68c_Column4Row4[0]",
    "p9_cash_benefit_row4_exempt_Yes": "form1[0].#subform[20].Pt9Line65_Row4_YesNo[0]",
    "p9_cash_benefit_row4_exempt_No": "form1[0].#subform[20].Pt9Line65_Row4_YesNo[1]",

    # Part 9 Item 66: Institutionalization Details Table (4 Rows)
    "p9_inst_care_row1_institution": "form1[0].#subform[20].Pt8Line68d_Column1Row1[0]",
    "p9_inst_care_row1_date_from": "form1[0].#subform[20].Pt8Line68d_Column2Row1[0]",
    "p9_inst_care_row1_date_to": "form1[0].#subform[20].Pt8Line68d_Column3Row1[0]",
    "p9_inst_care_row1_reason": "form1[0].#subform[20].Pt8Line68d_Column4Row1[0]",
    "p9_inst_care_row1_exempt_Yes": "form1[0].#subform[20].Pt9Line66_Row1_YesNo[0]",
    "p9_inst_care_row1_exempt_No": "form1[0].#subform[20].Pt9Line66_Row1_YesNo[1]",

    "p9_inst_care_row2_institution": "form1[0].#subform[20].Pt8Line68d_Column1Row2[0]",
    "p9_inst_care_row2_date_from": "form1[0].#subform[20].Pt8Line68d_Column2Row2[0]",
    "p9_inst_care_row2_date_to": "form1[0].#subform[20].Pt8Line68d_Column3Row2[0]",
    "p9_inst_care_row2_reason": "form1[0].#subform[20].Pt8Line68d_Column4Row2[0]",
    "p9_inst_care_row2_exempt_Yes": "form1[0].#subform[20].Pt9Line66_Row2_YesNo[0]",
    "p9_inst_care_row2_exempt_No": "form1[0].#subform[20].Pt9Line66_Row2_YesNo[1]",

    "p9_inst_care_row3_institution": "form1[0].#subform[20].Pt8Line68d_Column1Row3[0]",
    "p9_inst_care_row3_date_from": "form1[0].#subform[20].Pt8Line68d_Column2Row3[0]",
    "p9_inst_care_row3_date_to": "form1[0].#subform[20].Pt8Line68d_Column3Row3[0]",
    "p9_inst_care_row3_reason": "form1[0].#subform[20].Pt8Line68d_Column4Row3[0]",
    "p9_inst_care_row3_exempt_Yes": "form1[0].#subform[20].Pt9Line66_Row3_YesNo[0]",
    "p9_inst_care_row3_exempt_No": "form1[0].#subform[20].Pt9Line66_Row3_YesNo[1]",

    "p9_inst_care_row4_institution": "form1[0].#subform[20].Pt8Line68d_Column1Row4[0]",
    "p9_inst_care_row4_date_from": "form1[0].#subform[20].Pt8Line68d_Column2Row4[0]",
    "p9_inst_care_row4_date_to": "form1[0].#subform[20].Pt8Line68d_Column3Row4[0]",
    "p9_inst_care_row4_reason": "form1[0].#subform[20].Pt8Line68d_Column4Row4[0]",
    "p9_inst_care_row4_exempt_Yes": "form1[0].#subform[20].Pt9Line66_Row4_YesNo[0]",
    "p9_inst_care_row4_exempt_No": "form1[0].#subform[20].Pt9Line66_Row4_YesNo[1]",

    # Part 9 Items 67-73: Illegal Entries & Other Immigration Violations
    "p9_failed_attend_removal_proceeding_Yes": "form1[0].#subform[20].Pt9Line67_YesNo[1]",
    "p9_failed_attend_removal_proceeding_No": "form1[0].#subform[20].Pt9Line67_YesNo[0]",
    "p9_submitted_fraudulent_doc_Yes": "form1[0].#subform[20].Pt9Line68_YesNo[0]",
    "p9_submitted_fraudulent_doc_No": "form1[0].#subform[20].Pt9Line68_YesNo[1]",
    "p9_misrepresented_info_visa_Yes": "form1[0].#subform[20].Pt9Line69_YesNo[1]",
    "p9_misrepresented_info_visa_No": "form1[0].#subform[20].Pt9Line69_YesNo[0]",
    "p9_falsely_claimed_us_citizen_Yes": "form1[0].#subform[20].Pt9Line70_YesNo[0]",
    "p9_falsely_claimed_us_citizen_No": "form1[0].#subform[20].Pt9Line70_YesNo[1]",
    "p9_stowaway_Yes": "form1[0].#subform[20].Pt9Line71_YesNo[1]",
    "p9_stowaway_No": "form1[0].#subform[20].Pt9Line71_YesNo[0]",
    "p9_alien_smuggling_Yes": "form1[0].#subform[20].Pt9Line72_YesNo[0]",
    "p9_alien_smuggling_No": "form1[0].#subform[20].Pt9Line72_YesNo[1]",
    "p9_civil_penalty_fraudulent_docs_Yes": "form1[0].#subform[20].Pt9Line73_YesNo[1]",
    "p9_civil_penalty_fraudulent_docs_No": "form1[0].#subform[20].Pt9Line73_YesNo[0]",

    # Part 9 Items 74-75: Removal, Unlawful Presence, or Illegal Reentry
    "p9_deported_removed_departed_Yes": "form1[0].#subform[20].Pt9Line74_YesNo[1]",
    "p9_deported_removed_departed_No": "form1[0].#subform[20].Pt9Line74_YesNo[0]",
    "p9_entered_without_inspection_Yes": "form1[0].#subform[20].Pt9Line75_YesNo[0]",
    "p9_entered_without_inspection_No": "form1[0].#subform[20].Pt9Line75_YesNo[1]",

    # ============================================
    # PAGE 21: Part 9 Unlawful Presence (76-78b) & Miscellaneous Conduct (79-86)
    # ============================================
    # Page 21 Header & Barcode
    "p21_barcode": "form1[0].#pageSet[0].Page1[20].PDF417BarCode2[0]",
    "p21_header_alien_number": "form1[0].#subform[21].AlienNumber[20]",

    # Part 9 Item 76 & 77: Unlawful presence & trafficking reason
    "p9_unlawfully_present_since_1997_Yes": "form1[0].#subform[21].Pt9Line76_YesNo[1]",
    "p9_unlawfully_present_since_1997_No": "form1[0].#subform[21].Pt9Line76_YesNo[0]",
    "p9_unlawful_presence_trafficking_reason_Yes": "form1[0].#subform[21].Pt9Line77_YesNo[0]",
    "p9_unlawful_presence_trafficking_reason_No": "form1[0].#subform[21].Pt9Line77_YesNo[1]",

    # Part 9 Item 78.a & 78.b: Reentry without inspection
    "p9_reentered_unlawful_over_1yr_Yes": "form1[0].#subform[21].Pt9Line78a_YesNo[1]",
    "p9_reentered_unlawful_over_1yr_No": "form1[0].#subform[21].Pt9Line78a_YesNo[0]",
    "p9_reentered_after_deportation_Yes": "form1[0].#subform[21].Pt9Line78b_YesNo[0]",
    "p9_reentered_after_deportation_No": "form1[0].#subform[21].Pt9Line78b_YesNo[1]",

    # Part 9 Items 79-83: Miscellaneous Conduct
    "p9_polygamy_Yes": "form1[0].#subform[21].Pt9Line79_YesNo[0]",
    "p9_polygamy_No": "form1[0].#subform[21].Pt9Line79_YesNo[1]",
    "p9_accompanying_helpless_alien_Yes": "form1[0].#subform[21].Pt9Line80_YesNo[1]",
    "p9_accompanying_helpless_alien_No": "form1[0].#subform[21].Pt9Line80_YesNo[0]",
    "p9_withheld_us_child_custody_Yes": "form1[0].#subform[21].Pt9Line81_YesNo[0]",
    "p9_withheld_us_child_custody_No": "form1[0].#subform[21].Pt9Line81_YesNo[1]",
    "p9_illegal_voting_Yes": "form1[0].#subform[21].Pt9Line82_YesNo[1]",
    "p9_illegal_voting_No": "form1[0].#subform[21].Pt9Line82_YesNo[0]",
    "p9_renounced_us_citizenship_tax_Yes": "form1[0].#subform[21].Pt9Line83_YesNo[0]",
    "p9_renounced_us_citizenship_tax_No": "form1[0].#subform[21].Pt9Line83_YesNo[1]",

    # Part 9 Items 84.a - 86: Military Exemption, Desertion & Evasion
    "p9_applied_military_exemption_alien_Yes": "form1[0].#subform[21].Pt9Line84a_YesNo[1]",
    "p9_applied_military_exemption_alien_No": "form1[0].#subform[21].Pt9Line84a_YesNo[0]",
    "p9_relieved_military_service_alien_Yes": "form1[0].#subform[21].Pt9Line84b_YesNo[1]",
    "p9_relieved_military_service_alien_No": "form1[0].#subform[21].Pt9Line84b_YesNo[0]",
    "p9_convicted_military_desertion_Yes": "form1[0].#subform[21].Pt9Line84c_YesNo[1]",
    "p9_convicted_military_desertion_No": "form1[0].#subform[21].Pt9Line84c_YesNo[0]",
    "p9_evaded_military_service_war_Yes": "form1[0].#subform[21].Pt9Line85_YesNo[1]",
    "p9_evaded_military_service_war_No": "form1[0].#subform[21].Pt9Line85_YesNo[0]",
    "p9_evaded_military_nationality_text": "form1[0].#subform[21].Pt9Line86_Nationality[0]",

    # ============================================
    # PAGE 22: Part 10 Applicant Contact & Signature & Part 11 Interpreter Info & Signature
    # ============================================
    # Page 22 Header & Barcode
    "p22_barcode": "form1[0].#pageSet[0].Page1[21].PDF417BarCode2[0]",
    "p22_header_alien_number": "form1[0].#subform[22].AlienNumber[21]",

    # Part 10: Applicant Contact Info & Signature
    "p10_daytime_phone": "form1[0].#subform[22].Pt3Line3_DaytimePhoneNumber1[0]",
    "p10_mobile_phone": "form1[0].#subform[22].Pt3Line4_MobileNumber1[0]",
    "p10_email": "form1[0].#subform[22].Pt3Line5_Email[0]",
    "p10_signature": "form1[0].#subform[22].Pt3Line7a_Signature[0]",
    "p10_signature_date": "form1[0].#subform[22].Pt3Line7b_DateofSignature[0]",

    # Part 11: Interpreter Info, Contact, Certification & Signature
    "p11_interpreter_last_name": "form1[0].#subform[22].Pt11Line1a_FamilyName[0]",
    "p11_interpreter_first_name": "form1[0].#subform[22].Pt11Line1b_GivenName[0]",
    "p11_interpreter_org_name": "form1[0].#subform[22].Pt11Line2_OrgName[0]",
    "p11_interpreter_daytime_phone": "form1[0].#subform[22].P3_Line4_DaytimeTelePhoneNumber[0]",
    "p11_interpreter_mobile_phone": "form1[0].#subform[22].P3_Line5_MobileTelePhoneNumber[0]",
    "p11_interpreter_email": "form1[0].#subform[22].P3_Line6_Email[0]",
    "p11_interpreter_language": "form1[0].#subform[22].Part11_NameofLanguage[0]",
    "p11_interpreter_signature": "form1[0].#subform[22].P12_SignatureApplicant[0]",
    "p11_interpreter_signature_date": "form1[0].#subform[22].P13_DateofSignature[0]",

    # ============================================
    # PAGE 23: Part 12 Preparer Info & Signature & Part 13 Signature at Interview
    # ============================================
    # Page 23 Header & Barcode
    "p23_barcode": "form1[0].#pageSet[0].Page1[22].PDF417BarCode2[0]",
    "p23_header_alien_number": "form1[0].#subform[23].AlienNumber[22]",

    # Part 12: Preparer Info, Contact, Certification & Signature
    "p12_preparer_last_name": "form1[0].#subform[23].Pt12Line1_PreparerFamilyName[0]",
    "p12_preparer_first_name": "form1[0].#subform[23].Pt12Line1a_PreparerGivenName[0]",
    "p12_preparer_org_name": "form1[0].#subform[23].Pt12Line2_BusinessName[0]",
    "p12_preparer_daytime_phone": "form1[0].#subform[23].Pt12Line3_PreparerDaytimePhoneNumber1[0]",
    "p12_preparer_mobile_phone": "form1[0].#subform[23].Pt12Line4_PreparerMobileNumber[0]",
    "p12_preparer_email": "form1[0].#subform[23].Pt12Line5_PreparerEmail[0]",
    "p12_preparer_signature": "form1[0].#subform[23].P12Line6_SignaturePreparer[0]",
    "p12_preparer_signature_date": "form1[0].#subform[23].P12Line6a_DateofSignature[0]",

    # Part 13: Signature at Interview (Completed only at interview with USCIS Officer)
    "p13_interview_corrections1": "form1[0].#subform[23].Pt13_Corrections1[0]",
    "p13_interview_corrections2_start": "form1[0].#subform[23].Pt13_Corrections2[0]",
    "p13_interview_corrections2_end": "form1[0].#subform[23].Pt13_Corrections2[1]",
    "p13_interview_pages_start": "form1[0].#subform[23].Pt13_Pages1[0]",
    "p13_interview_pages_end": "form1[0].#subform[23].Pt13_Pages2[0]",
    "p13_uscis_officer_name": "form1[0].#subform[23].Pt13_USCISOfficer[0]",
    "p13_interview_signature_date": "form1[0].#subform[23].Pt13_DateofSignature[0]",
    "p13_applicant_interview_signature": "form1[0].#subform[23].Pt13_ApplicantSignature[0]",
    "p13_uscis_officer_signature": "form1[0].#subform[23].Pt13_USCISSignature[0]",

    # ============================================
    # PAGE 24: Part 14 Additional Information
    # ============================================
    # Page 24 Header & Barcode
    "p24_barcode": "form1[0].#pageSet[0].Page1[23].PDF417BarCode2[0]",
    "p24_header_alien_number": "form1[0].#subform[24].AlienNumber[23]",

    # Part 14 Item 1: Name
    "p14_applicant_last_name": "form1[0].#subform[24].Pt1Line1_FamilyName[1]",
    "p14_applicant_first_name": "form1[0].#subform[24].Pt1Line1_GivenName[1]",
    "p14_applicant_middle_name": "form1[0].#subform[24].Pt1Line1_MiddleName[1]",

    # Part 14 Item 2
    "p14_item2_page_number": "form1[0].#subform[24].Pt9Line3a_PageNumber[0]",
    "p14_item2_part_number": "form1[0].#subform[24].Pt9Line3b_PartNumber[0]",
    "p14_item2_item_number": "form1[0].#subform[24].Pt9Line3c_ItemNumber[0]",
    "p14_item2_text": "form1[0].#subform[24].P14_Line2_AdditionalInfo[0]",

    # Part 14 Item 3
    "p14_item3_page_number": "form1[0].#subform[24].Pt9Line3a_PageNumber[1]",
    "p14_item3_part_number": "form1[0].#subform[24].Pt9Line3b_PartNumber[1]",
    "p14_item3_item_number": "form1[0].#subform[24].Pt9Line3c_ItemNumber[1]",
    "p14_item3_text": "form1[0].#subform[24].P14_Line3_AdditionalInfo[0]",

    # Part 14 Item 4
    "p14_item4_page_number": "form1[0].#subform[24].Pt9Line3a_PageNumber[2]",
    "p14_item4_part_number": "form1[0].#subform[24].Pt9Line3b_PartNumber[2]",
    "p14_item4_item_number": "form1[0].#subform[24].Pt9Line3c_ItemNumber[2]",
    "p14_item4_text": "form1[0].#subform[24].P14_Line4_AdditionalInfo[0]",

    # Part 14 Item 5
    "p14_item5_page_number": "form1[0].#subform[24].Pt9Line3a_PageNumber[3]",
    "p14_item5_part_number": "form1[0].#subform[24].Pt9Line3b_PartNumber[3]",
    "p14_item5_item_number": "form1[0].#subform[24].Pt9Line3c_ItemNumber[3]",
    "p14_item5_text": "form1[0].#subform[24].P14_Line5_AdditionalInfo[0]",
}
