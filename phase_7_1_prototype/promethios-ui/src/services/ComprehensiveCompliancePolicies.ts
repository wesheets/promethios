/**
 * Comprehensive Compliance Policies
 * 
 * Complete rule sets for major compliance frameworks.
 * Provides full compliance coverage, not just sample rules.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

import { PolicyContent, PolicyRule } from './UnifiedPolicyRegistry';

/**
 * COMPREHENSIVE HIPAA COMPLIANCE POLICY
 * Covers all major HIPAA requirements for complete compliance
 */
export const COMPREHENSIVE_HIPAA_POLICY: PolicyContent = {
  policy_id: 'hipaa_comprehensive_v1',
  name: 'Comprehensive HIPAA Compliance Policy',
  version: '1.0.0',
  status: 'active',
  category: 'compliance',
  description: 'Complete HIPAA compliance policy covering all Privacy Rule, Security Rule, and Breach Notification requirements',
  legalFramework: 'Health Insurance Portability and Accountability Act (HIPAA) - 45 CFR Parts 160, 162, and 164',
  jurisdiction: ['US'],
  summary: 'Comprehensive protection of Protected Health Information (PHI) through complete HIPAA compliance',
  purpose: 'Ensure full compliance with all HIPAA Privacy Rule, Security Rule, and Breach Notification requirements',
  scope: 'All interactions involving healthcare data, patient information, medical records, or health-related communications',
  
  rules: [
    // PRIVACY RULE REQUIREMENTS (45 CFR 164.500-164.534)
    {
      rule_id: 'hipaa_phi_identification',
      name: 'PHI Identification and Classification',
      description: 'Identify and classify all 18 types of Protected Health Information',
      condition: 'contains_any_phi_identifier(content)',
      action: 'alert',
      priority: 100,
      legalBasis: 'HIPAA 45 CFR 164.514(b)(2) - Safe harbor method',
      violationMessage: 'Protected Health Information detected. HIPAA requires special handling of all 18 PHI identifiers including names, addresses, dates, SSNs, medical record numbers, and biometric identifiers.',
      complianceMessage: 'PHI properly identified and classified according to HIPAA safe harbor standards.',
      parameters: {
        phi_identifiers: [
          'names', 'geographic_subdivisions', 'dates_related_to_individual',
          'telephone_numbers', 'fax_numbers', 'email_addresses', 'ssn',
          'medical_record_numbers', 'health_plan_beneficiary_numbers',
          'account_numbers', 'certificate_license_numbers', 'vehicle_identifiers',
          'device_identifiers', 'web_urls', 'ip_addresses', 'biometric_identifiers',
          'full_face_photos', 'unique_identifying_numbers'
        ]
      }
    },
    {
      rule_id: 'hipaa_minimum_necessary_access',
      name: 'Minimum Necessary Standard - Access',
      description: 'Limit PHI access to minimum necessary for intended purpose',
      condition: 'interaction_type == "phi_access" OR data_types.includes("healthcare")',
      action: 'escalate',
      priority: 95,
      legalBasis: 'HIPAA 45 CFR 164.502(b) - Minimum necessary requirements',
      violationMessage: 'PHI access must be limited to the minimum necessary to accomplish the intended purpose per HIPAA 164.502(b). Please specify legitimate purpose and minimum data required.',
      complianceMessage: 'PHI access limited to minimum necessary as required by HIPAA.',
      parameters: {
        require_purpose_justification: true,
        require_data_minimization: true,
        log_access_scope: true
      }
    },
    {
      rule_id: 'hipaa_minimum_necessary_disclosure',
      name: 'Minimum Necessary Standard - Disclosure',
      description: 'Limit PHI disclosure to minimum necessary',
      condition: 'interaction_type == "phi_disclosure" OR sharing_phi == true',
      action: 'escalate',
      priority: 95,
      legalBasis: 'HIPAA 45 CFR 164.502(b) - Minimum necessary requirements',
      violationMessage: 'PHI disclosure must be limited to minimum necessary per HIPAA 164.502(b). Disclosure requires authorization or permitted use justification.',
      complianceMessage: 'PHI disclosure properly limited to minimum necessary.',
      parameters: {
        require_authorization: true,
        require_disclosure_justification: true,
        limit_disclosed_data: true
      }
    },
    {
      rule_id: 'hipaa_individual_authorization',
      name: 'Individual Authorization Requirements',
      description: 'Require valid authorization for PHI use/disclosure',
      condition: 'phi_use_disclosure == true AND NOT permitted_use_disclosure(purpose)',
      action: 'deny',
      priority: 100,
      legalBasis: 'HIPAA 45 CFR 164.508 - Uses and disclosures for which an authorization is required',
      violationMessage: 'PHI use or disclosure requires valid individual authorization per HIPAA 164.508. Authorization must include required elements and be properly executed.',
      complianceMessage: 'Valid individual authorization obtained for PHI use/disclosure.',
      parameters: {
        required_authorization_elements: [
          'description_of_phi', 'persons_authorized_to_make_disclosure',
          'persons_to_whom_disclosure_made', 'purpose_of_disclosure',
          'expiration_date', 'individual_signature', 'date_signed'
        ]
      }
    },
    {
      rule_id: 'hipaa_individual_rights_access',
      name: 'Individual Right of Access',
      description: 'Support individual right to access their PHI',
      condition: 'interaction_type == "individual_access_request"',
      action: 'escalate',
      priority: 90,
      legalBasis: 'HIPAA 45 CFR 164.524 - Access of individuals to protected health information',
      violationMessage: 'Individual access requests must be honored within 30 days per HIPAA 164.524. Provide access in requested format when readily producible.',
      complianceMessage: 'Individual access request properly processed according to HIPAA requirements.',
      parameters: {
        response_timeframe: '30_days',
        provide_requested_format: true,
        may_charge_reasonable_fee: true,
        grounds_for_denial: ['psychotherapy_notes', 'compiled_for_legal_proceedings']
      }
    },
    {
      rule_id: 'hipaa_individual_rights_amendment',
      name: 'Individual Right to Amend',
      description: 'Support individual right to amend their PHI',
      condition: 'interaction_type == "amendment_request"',
      action: 'escalate',
      priority: 85,
      legalBasis: 'HIPAA 45 CFR 164.526 - Amendment of protected health information',
      violationMessage: 'Amendment requests must be processed within 60 days per HIPAA 164.526. Must provide written response accepting or denying amendment.',
      complianceMessage: 'Amendment request properly processed according to HIPAA requirements.',
      parameters: {
        response_timeframe: '60_days',
        extension_allowed: '30_days',
        denial_grounds: ['not_created_by_entity', 'not_part_of_designated_record_set', 'accurate_and_complete']
      }
    },
    {
      rule_id: 'hipaa_individual_rights_accounting',
      name: 'Individual Right to Accounting of Disclosures',
      description: 'Provide accounting of PHI disclosures',
      condition: 'interaction_type == "accounting_request"',
      action: 'escalate',
      priority: 85,
      legalBasis: 'HIPAA 45 CFR 164.528 - Accounting of disclosures of protected health information',
      violationMessage: 'Accounting of disclosures must be provided within 60 days per HIPAA 164.528. Must include date, recipient, purpose, and description of PHI disclosed.',
      complianceMessage: 'Accounting of disclosures properly provided according to HIPAA requirements.',
      parameters: {
        response_timeframe: '60_days',
        accounting_period: '6_years',
        required_elements: ['date_of_disclosure', 'name_of_recipient', 'brief_description_of_phi', 'purpose_of_disclosure']
      }
    },

    // SECURITY RULE REQUIREMENTS (45 CFR 164.302-164.318)
    {
      rule_id: 'hipaa_administrative_safeguards',
      name: 'Administrative Safeguards',
      description: 'Implement required administrative safeguards',
      condition: 'handling_ephi == true',
      action: 'log',
      priority: 90,
      legalBasis: 'HIPAA 45 CFR 164.308 - Administrative safeguards',
      violationMessage: 'Administrative safeguards required for ePHI per HIPAA 164.308. Must have security officer, workforce training, access management, and incident procedures.',
      complianceMessage: 'Administrative safeguards properly implemented for ePHI handling.',
      parameters: {
        required_safeguards: [
          'security_officer_assigned', 'workforce_training_completed',
          'information_access_management', 'security_awareness_training',
          'security_incident_procedures', 'contingency_plan',
          'periodic_security_evaluations'
        ]
      }
    },
    {
      rule_id: 'hipaa_physical_safeguards',
      name: 'Physical Safeguards',
      description: 'Implement required physical safeguards',
      condition: 'accessing_ephi_systems == true',
      action: 'log',
      priority: 90,
      legalBasis: 'HIPAA 45 CFR 164.310 - Physical safeguards',
      violationMessage: 'Physical safeguards required for ePHI systems per HIPAA 164.310. Must control facility access, workstation use, and media controls.',
      complianceMessage: 'Physical safeguards properly implemented for ePHI systems.',
      parameters: {
        required_safeguards: [
          'facility_access_controls', 'workstation_use_restrictions',
          'device_and_media_controls'
        ]
      }
    },
    {
      rule_id: 'hipaa_technical_safeguards',
      name: 'Technical Safeguards',
      description: 'Implement required technical safeguards',
      condition: 'processing_ephi == true',
      action: 'encrypt',
      priority: 95,
      legalBasis: 'HIPAA 45 CFR 164.312 - Technical safeguards',
      violationMessage: 'Technical safeguards required for ePHI per HIPAA 164.312. Must implement access control, audit controls, integrity, transmission security.',
      complianceMessage: 'Technical safeguards properly implemented for ePHI processing.',
      parameters: {
        required_safeguards: [
          'access_control', 'audit_controls', 'integrity_controls',
          'person_or_entity_authentication', 'transmission_security'
        ],
        encryption_required: true,
        audit_logging_required: true
      }
    },
    {
      rule_id: 'hipaa_encryption_ephi',
      name: 'ePHI Encryption Requirements',
      description: 'Encrypt ePHI in transit and at rest',
      condition: 'contains_ephi(content) OR data_types.includes("healthcare")',
      action: 'encrypt',
      priority: 100,
      legalBasis: 'HIPAA 45 CFR 164.312(a)(2)(iv) and 164.312(e)(2)(ii) - Encryption',
      violationMessage: 'ePHI must be encrypted in transit and at rest per HIPAA 164.312. Use NIST-approved encryption standards.',
      complianceMessage: 'ePHI properly encrypted according to HIPAA technical safeguards.',
      parameters: {
        encryption_standards: ['AES-256', 'RSA-2048'],
        transit_encryption: 'TLS-1.2_minimum',
        rest_encryption: 'AES-256',
        key_management_required: true
      }
    },
    {
      rule_id: 'hipaa_audit_controls',
      name: 'Audit Controls and Logging',
      description: 'Implement comprehensive audit controls',
      condition: 'accessing_ephi == true OR processing_ephi == true',
      action: 'log',
      priority: 95,
      legalBasis: 'HIPAA 45 CFR 164.312(b) - Audit controls',
      violationMessage: 'Audit controls required for all ePHI access per HIPAA 164.312(b). Must log user access, actions performed, and system activity.',
      complianceMessage: 'Comprehensive audit logging implemented for ePHI access.',
      parameters: {
        log_elements: [
          'user_identification', 'date_time', 'type_of_action',
          'patient_record_accessed', 'source_of_access', 'success_failure'
        ],
        log_retention: '6_years',
        log_integrity_protection: true
      }
    },

    // BREACH NOTIFICATION REQUIREMENTS (45 CFR 164.400-164.414)
    {
      rule_id: 'hipaa_breach_assessment',
      name: 'Breach Risk Assessment',
      description: 'Assess potential breaches using 4-factor test',
      condition: 'potential_phi_breach == true',
      action: 'escalate',
      priority: 100,
      legalBasis: 'HIPAA 45 CFR 164.402 - Breach notification requirements',
      violationMessage: 'Potential PHI breach requires immediate risk assessment per HIPAA 164.402. Must evaluate using 4-factor test within 60 days.',
      complianceMessage: 'Breach risk assessment initiated according to HIPAA requirements.',
      parameters: {
        four_factor_test: [
          'nature_and_extent_of_phi', 'person_who_used_disclosed_phi',
          'whether_phi_actually_acquired_viewed', 'extent_risk_mitigated'
        ],
        assessment_timeframe: '60_days'
      }
    },
    {
      rule_id: 'hipaa_breach_notification_individual',
      name: 'Individual Breach Notification',
      description: 'Notify affected individuals of breaches',
      condition: 'confirmed_breach == true',
      action: 'escalate',
      priority: 100,
      legalBasis: 'HIPAA 45 CFR 164.404 - Notification to individuals',
      violationMessage: 'Individual breach notification required within 60 days per HIPAA 164.404. Must include required elements and use appropriate method.',
      complianceMessage: 'Individual breach notification properly executed.',
      parameters: {
        notification_timeframe: '60_days',
        required_elements: [
          'brief_description_of_breach', 'description_of_phi_involved',
          'steps_individuals_should_take', 'what_entity_is_doing',
          'contact_procedures'
        ]
      }
    },
    {
      rule_id: 'hipaa_breach_notification_hhs',
      name: 'HHS Breach Notification',
      description: 'Notify HHS of breaches',
      condition: 'confirmed_breach == true',
      action: 'escalate',
      priority: 100,
      legalBasis: 'HIPAA 45 CFR 164.408 - Notification to the Secretary',
      violationMessage: 'HHS breach notification required per HIPAA 164.408. Large breaches (500+) within 60 days, smaller breaches annually.',
      complianceMessage: 'HHS breach notification properly submitted.',
      parameters: {
        large_breach_threshold: 500,
        large_breach_timeframe: '60_days',
        small_breach_timeframe: 'annual'
      }
    },
    {
      rule_id: 'hipaa_breach_notification_media',
      name: 'Media Breach Notification',
      description: 'Notify media of large breaches',
      condition: 'confirmed_breach == true AND affected_individuals >= 500',
      action: 'escalate',
      priority: 95,
      legalBasis: 'HIPAA 45 CFR 164.406 - Notification to the media',
      violationMessage: 'Media notification required for breaches affecting 500+ individuals per HIPAA 164.406. Must notify prominent media outlets in affected areas.',
      complianceMessage: 'Media breach notification properly executed.',
      parameters: {
        threshold: 500,
        notification_timeframe: '60_days',
        target_media: 'prominent_outlets_in_state_or_jurisdiction'
      }
    }
  ],
  
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'system',
  compliance_mappings: {
    'HIPAA_Privacy_Rule': ['164.502', '164.508', '164.514', '164.524', '164.526', '164.528'],
    'HIPAA_Security_Rule': ['164.308', '164.310', '164.312'],
    'HIPAA_Breach_Notification': ['164.402', '164.404', '164.406', '164.408'],
    'HITECH_Act': ['13402', '13404', '13405', '13407', '13408']
  }
};

/**
 * COMPREHENSIVE SOX COMPLIANCE POLICY
 * Covers all major Sarbanes-Oxley requirements for complete compliance
 */
export const COMPREHENSIVE_SOX_POLICY: PolicyContent = {
  policy_id: 'sox_comprehensive_v1',
  name: 'Comprehensive SOX Compliance Policy',
  version: '1.0.0',
  status: 'active',
  category: 'compliance',
  description: 'Complete Sarbanes-Oxley Act compliance policy covering all sections relevant to financial reporting and internal controls',
  legalFramework: 'Sarbanes-Oxley Act of 2002 (SOX) - Public Law 107-204',
  jurisdiction: ['US'],
  summary: 'Comprehensive financial reporting controls and corporate governance requirements under SOX',
  purpose: 'Ensure full compliance with all SOX requirements for financial reporting accuracy, internal controls, and corporate governance',
  scope: 'All interactions involving financial data, reporting systems, internal controls, and corporate governance processes',
  
  rules: [
    // SECTION 302 - CORPORATE RESPONSIBILITY FOR FINANCIAL REPORTS
    {
      rule_id: 'sox_302_ceo_cfo_certification',
      name: 'CEO/CFO Financial Report Certification',
      description: 'Ensure CEO/CFO certification requirements for financial reports',
      condition: 'interaction_type == "financial_report" OR document_type == "10k" OR document_type == "10q"',
      action: 'escalate',
      priority: 100,
      legalBasis: 'SOX Section 302 - Corporate responsibility for financial reports',
      violationMessage: 'Financial reports require CEO/CFO certification per SOX Section 302. Must certify accuracy, completeness, and effectiveness of internal controls.',
      complianceMessage: 'Financial report prepared for proper CEO/CFO certification under SOX 302.',
      parameters: {
        required_certifications: [
          'reviewed_report', 'no_untrue_statements', 'no_material_omissions',
          'fairly_presents_financial_condition', 'responsible_for_internal_controls',
          'evaluated_effectiveness', 'disclosed_deficiencies'
        ]
      }
    },
    {
      rule_id: 'sox_302_internal_controls_disclosure',
      name: 'Internal Controls Disclosure',
      description: 'Disclose material changes in internal controls',
      condition: 'internal_controls_changed == true OR interaction_type == "controls_assessment"',
      action: 'escalate',
      priority: 95,
      legalBasis: 'SOX Section 302(a)(5) - Internal controls disclosure',
      violationMessage: 'Material changes in internal controls must be disclosed per SOX 302(a)(5). Must report changes that materially affect financial reporting.',
      complianceMessage: 'Internal controls changes properly disclosed under SOX 302.',
      parameters: {
        disclosure_triggers: [
          'design_changes', 'operating_effectiveness_changes',
          'material_weaknesses_identified', 'significant_deficiencies'
        ]
      }
    },

    // SECTION 404 - MANAGEMENT ASSESSMENT OF INTERNAL CONTROLS
    {
      rule_id: 'sox_404_management_assessment',
      name: 'Management Assessment of Internal Controls',
      description: 'Require management assessment of internal control effectiveness',
      condition: 'interaction_type == "internal_controls_assessment" OR annual_report == true',
      action: 'escalate',
      priority: 100,
      legalBasis: 'SOX Section 404(a) - Management assessment of internal controls',
      violationMessage: 'Management must assess and report on internal control effectiveness per SOX 404(a). Annual assessment required in Form 10-K.',
      complianceMessage: 'Management assessment of internal controls properly conducted under SOX 404.',
      parameters: {
        assessment_requirements: [
          'establish_maintain_adequate_controls', 'assess_effectiveness',
          'identify_material_weaknesses', 'management_report_required'
        ],
        assessment_frequency: 'annual'
      }
    },
    {
      rule_id: 'sox_404_auditor_attestation',
      name: 'Auditor Attestation on Internal Controls',
      description: 'Require auditor attestation on management assessment',
      condition: 'public_company == true AND interaction_type == "auditor_attestation"',
      action: 'escalate',
      priority: 95,
      legalBasis: 'SOX Section 404(b) - Auditor attestation',
      violationMessage: 'Public companies require auditor attestation on internal controls per SOX 404(b). Auditor must attest to management assessment.',
      complianceMessage: 'Auditor attestation on internal controls properly obtained under SOX 404.',
      parameters: {
        attestation_requirements: [
          'audit_management_assessment', 'test_operating_effectiveness',
          'identify_material_weaknesses', 'issue_attestation_report'
        ]
      }
    },
    {
      rule_id: 'sox_404_deficiency_remediation',
      name: 'Internal Control Deficiency Remediation',
      description: 'Require remediation of internal control deficiencies',
      condition: 'control_deficiency_identified == true',
      action: 'escalate',
      priority: 90,
      legalBasis: 'SOX Section 404 - Internal control requirements',
      violationMessage: 'Internal control deficiencies must be remediated per SOX 404. Material weaknesses require immediate attention and disclosure.',
      complianceMessage: 'Internal control deficiency remediation properly initiated.',
      parameters: {
        deficiency_types: ['material_weakness', 'significant_deficiency', 'control_deficiency'],
        remediation_timeframes: {
          'material_weakness': 'immediate',
          'significant_deficiency': '90_days',
          'control_deficiency': '180_days'
        }
      }
    },

    // SECTION 409 - REAL TIME ISSUER DISCLOSURES
    {
      rule_id: 'sox_409_material_changes',
      name: 'Real-Time Material Change Disclosure',
      description: 'Require real-time disclosure of material changes',
      condition: 'material_change_occurred == true',
      action: 'escalate',
      priority: 100,
      legalBasis: 'SOX Section 409 - Real time issuer disclosures',
      violationMessage: 'Material changes must be disclosed on Form 8-K within 4 business days per SOX 409. Must provide plain English disclosure.',
      complianceMessage: 'Material change disclosure properly initiated under SOX 409.',
      parameters: {
        disclosure_timeframe: '4_business_days',
        material_events: [
          'completion_acquisition_disposition', 'bankruptcy_receivership',
          'material_agreements', 'accountant_changes', 'financial_statements',
          'changes_corporate_governance', 'material_impairments'
        ]
      }
    },

    // SECTION 802 - CRIMINAL PENALTIES FOR ALTERING DOCUMENTS
    {
      rule_id: 'sox_802_document_retention',
      name: 'Document Retention Requirements',
      description: 'Enforce document retention and prevent destruction',
      condition: 'handling_audit_documents == true OR litigation_hold == true',
      action: 'log',
      priority: 100,
      legalBasis: 'SOX Section 802 - Criminal penalties for altering documents',
      violationMessage: 'Audit documents must be retained for 7 years per SOX 802. Destruction during investigation is criminal offense.',
      complianceMessage: 'Document retention properly enforced under SOX 802.',
      parameters: {
        retention_period: '7_years',
        protected_documents: [
          'audit_workpapers', 'financial_records', 'correspondence',
          'memoranda', 'recommendations', 'advice'
        ],
        destruction_prohibition: 'during_investigation_or_litigation'
      }
    },
    {
      rule_id: 'sox_802_audit_trail_integrity',
      name: 'Audit Trail Integrity Protection',
      description: 'Protect integrity of audit trails and financial records',
      condition: 'financial_record_access == true OR audit_trail_modification == true',
      action: 'log',
      priority: 100,
      legalBasis: 'SOX Section 802 - Criminal penalties for altering documents',
      violationMessage: 'Audit trails and financial records must maintain integrity per SOX 802. Unauthorized alteration is prohibited.',
      complianceMessage: 'Audit trail integrity properly protected under SOX 802.',
      parameters: {
        integrity_controls: [
          'immutable_logging', 'cryptographic_hashing', 'access_controls',
          'change_tracking', 'approval_workflows'
        ]
      }
    },

    // SECTION 906 - CORPORATE RESPONSIBILITY FOR FINANCIAL REPORTS
    {
      rule_id: 'sox_906_periodic_report_certification',
      name: 'Periodic Report Certification',
      description: 'CEO/CFO certification of periodic reports',
      condition: 'periodic_report == true AND (document_type == "10k" OR document_type == "10q")',
      action: 'escalate',
      priority: 100,
      legalBasis: 'SOX Section 906 - Corporate responsibility for financial reports',
      violationMessage: 'Periodic reports require CEO/CFO certification per SOX 906. Must certify compliance with securities laws and fair presentation.',
      complianceMessage: 'Periodic report prepared for proper certification under SOX 906.',
      parameters: {
        certification_requirements: [
          'complies_with_securities_laws', 'fairly_presents_financial_condition',
          'personal_knowledge_basis'
        ]
      }
    },

    // FINANCIAL REPORTING CONTROLS
    {
      rule_id: 'sox_segregation_of_duties',
      name: 'Segregation of Duties',
      description: 'Enforce segregation of duties in financial processes',
      condition: 'financial_process == true',
      action: 'alert',
      priority: 90,
      legalBasis: 'SOX Section 404 - Internal control requirements',
      violationMessage: 'Segregation of duties required for financial processes per SOX 404. No single person should control entire financial transaction.',
      complianceMessage: 'Proper segregation of duties maintained in financial processes.',
      parameters: {
        incompatible_functions: [
          ['authorization', 'recording'], ['authorization', 'custody'],
          ['recording', 'custody'], ['preparation', 'approval']
        ]
      }
    },
    {
      rule_id: 'sox_financial_system_access',
      name: 'Financial System Access Controls',
      description: 'Control access to financial systems and data',
      condition: 'financial_system_access == true',
      action: 'log',
      priority: 95,
      legalBasis: 'SOX Section 404 - Internal control requirements',
      violationMessage: 'Financial system access must be controlled per SOX 404. Require proper authorization and regular access reviews.',
      complianceMessage: 'Financial system access properly controlled and logged.',
      parameters: {
        access_controls: [
          'role_based_access', 'least_privilege', 'regular_access_reviews',
          'termination_procedures', 'privileged_access_monitoring'
        ]
      }
    },
    {
      rule_id: 'sox_change_management',
      name: 'IT Change Management for Financial Systems',
      description: 'Control changes to financial reporting systems',
      condition: 'financial_system_change == true',
      action: 'escalate',
      priority: 95,
      legalBasis: 'SOX Section 404 - Internal control requirements',
      violationMessage: 'Changes to financial systems require proper change management per SOX 404. Must have approval, testing, and documentation.',
      complianceMessage: 'Financial system changes properly managed under SOX requirements.',
      parameters: {
        change_management_requirements: [
          'change_request_approval', 'impact_assessment', 'testing_requirements',
          'rollback_procedures', 'change_documentation'
        ]
      }
    },
    {
      rule_id: 'sox_financial_close_process',
      name: 'Financial Close Process Controls',
      description: 'Control financial close and reporting processes',
      condition: 'financial_close_process == true',
      action: 'log',
      priority: 90,
      legalBasis: 'SOX Section 404 - Internal control requirements',
      violationMessage: 'Financial close process requires proper controls per SOX 404. Must have review, approval, and documentation.',
      complianceMessage: 'Financial close process properly controlled and documented.',
      parameters: {
        close_process_controls: [
          'account_reconciliations', 'journal_entry_reviews',
          'management_review_approval', 'supporting_documentation'
        ]
      }
    }
  ],
  
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'system',
  compliance_mappings: {
    'SOX': ['302', '404', '409', '802', '906'],
    'SEC_Rules': ['13a-14', '13a-15', '15d-14', '15d-15'],
    'PCAOB_Standards': ['AS_2201', 'AS_2301', 'AS_1215']
  }
};

/**
 * COMPREHENSIVE GDPR COMPLIANCE POLICY
 * Covers all major GDPR requirements for complete compliance
 */
export const COMPREHENSIVE_GDPR_POLICY: PolicyContent = {
  policy_id: 'gdpr_comprehensive_v1',
  name: 'Comprehensive GDPR Compliance Policy',
  version: '1.0.0',
  status: 'active',
  category: 'privacy',
  description: 'Complete GDPR compliance policy covering all data protection principles, individual rights, and organizational obligations',
  legalFramework: 'General Data Protection Regulation (GDPR) - Regulation (EU) 2016/679',
  jurisdiction: ['EU', 'EEA', 'UK'],
  summary: 'Comprehensive personal data protection through complete GDPR compliance',
  purpose: 'Ensure full compliance with all GDPR requirements for personal data processing, individual rights, and organizational accountability',
  scope: 'All processing of personal data of EU/EEA/UK residents, regardless of processing location',
  
  rules: [
    // ARTICLE 5 - PRINCIPLES OF PROCESSING
    {
      rule_id: 'gdpr_lawfulness_fairness_transparency',
      name: 'Lawfulness, Fairness, and Transparency',
      description: 'Ensure processing is lawful, fair, and transparent',
      condition: 'processing_personal_data == true',
      action: 'alert',
      priority: 100,
      legalBasis: 'GDPR Article 5(1)(a) - Lawfulness, fairness and transparency',
      violationMessage: 'Personal data processing must be lawful, fair, and transparent per GDPR Article 5(1)(a). Must have valid legal basis and provide clear information to data subjects.',
      complianceMessage: 'Personal data processing meets lawfulness, fairness, and transparency requirements.',
      parameters: {
        transparency_requirements: [
          'clear_privacy_notice', 'plain_language', 'easily_accessible',
          'specific_purposes', 'legal_basis_identified'
        ]
      }
    },
    {
      rule_id: 'gdpr_purpose_limitation',
      name: 'Purpose Limitation',
      description: 'Limit processing to specified, explicit, legitimate purposes',
      condition: 'processing_personal_data == true',
      action: 'alert',
      priority: 95,
      legalBasis: 'GDPR Article 5(1)(b) - Purpose limitation',
      violationMessage: 'Personal data must be processed for specified, explicit, and legitimate purposes per GDPR Article 5(1)(b). Further processing must be compatible with original purpose.',
      complianceMessage: 'Personal data processing limited to specified legitimate purposes.',
      parameters: {
        purpose_requirements: [
          'specified_purposes', 'explicit_purposes', 'legitimate_purposes',
          'compatibility_assessment_for_further_processing'
        ]
      }
    },
    {
      rule_id: 'gdpr_data_minimisation',
      name: 'Data Minimisation',
      description: 'Ensure data is adequate, relevant, and limited to necessary',
      condition: 'processing_personal_data == true',
      action: 'alert',
      priority: 90,
      legalBasis: 'GDPR Article 5(1)(c) - Data minimisation',
      violationMessage: 'Personal data must be adequate, relevant, and limited to what is necessary per GDPR Article 5(1)(c). Collect and process only minimum data required.',
      complianceMessage: 'Personal data processing follows data minimisation principle.',
      parameters: {
        minimisation_checks: [
          'adequacy_assessment', 'relevance_assessment', 'necessity_assessment',
          'regular_data_reviews'
        ]
      }
    },
    {
      rule_id: 'gdpr_accuracy',
      name: 'Accuracy',
      description: 'Ensure personal data is accurate and up to date',
      condition: 'storing_personal_data == true',
      action: 'alert',
      priority: 85,
      legalBasis: 'GDPR Article 5(1)(d) - Accuracy',
      violationMessage: 'Personal data must be accurate and kept up to date per GDPR Article 5(1)(d). Inaccurate data must be erased or rectified without delay.',
      complianceMessage: 'Personal data accuracy maintained according to GDPR requirements.',
      parameters: {
        accuracy_measures: [
          'regular_data_verification', 'correction_procedures',
          'data_quality_controls', 'source_verification'
        ]
      }
    },
    {
      rule_id: 'gdpr_storage_limitation',
      name: 'Storage Limitation',
      description: 'Limit storage duration to necessary period',
      condition: 'storing_personal_data == true',
      action: 'alert',
      priority: 85,
      legalBasis: 'GDPR Article 5(1)(e) - Storage limitation',
      violationMessage: 'Personal data must not be kept longer than necessary per GDPR Article 5(1)(e). Must have retention schedules and deletion procedures.',
      complianceMessage: 'Personal data storage limited to necessary retention period.',
      parameters: {
        retention_requirements: [
          'defined_retention_periods', 'regular_deletion_reviews',
          'automated_deletion_where_possible', 'archival_procedures'
        ]
      }
    },
    {
      rule_id: 'gdpr_integrity_confidentiality',
      name: 'Integrity and Confidentiality',
      description: 'Ensure appropriate security of personal data',
      condition: 'processing_personal_data == true',
      action: 'encrypt',
      priority: 95,
      legalBasis: 'GDPR Article 5(1)(f) - Integrity and confidentiality',
      violationMessage: 'Personal data must be processed securely per GDPR Article 5(1)(f). Must implement appropriate technical and organisational measures.',
      complianceMessage: 'Personal data security measures properly implemented.',
      parameters: {
        security_measures: [
          'encryption_in_transit', 'encryption_at_rest', 'access_controls',
          'regular_security_testing', 'incident_response_procedures'
        ]
      }
    },

    // ARTICLE 6 - LAWFULNESS OF PROCESSING
    {
      rule_id: 'gdpr_lawful_basis_identification',
      name: 'Lawful Basis Identification',
      description: 'Identify and document lawful basis for processing',
      condition: 'processing_personal_data == true',
      action: 'escalate',
      priority: 100,
      legalBasis: 'GDPR Article 6 - Lawfulness of processing',
      violationMessage: 'Processing requires valid lawful basis per GDPR Article 6. Must identify and document appropriate legal basis before processing.',
      complianceMessage: 'Valid lawful basis identified and documented for processing.',
      parameters: {
        lawful_bases: [
          'consent', 'contract', 'legal_obligation', 'vital_interests',
          'public_task', 'legitimate_interests'
        ],
        documentation_required: true
      }
    },
    {
      rule_id: 'gdpr_legitimate_interests_assessment',
      name: 'Legitimate Interests Assessment',
      description: 'Conduct balancing test for legitimate interests',
      condition: 'lawful_basis == "legitimate_interests"',
      action: 'escalate',
      priority: 95,
      legalBasis: 'GDPR Article 6(1)(f) - Legitimate interests',
      violationMessage: 'Legitimate interests processing requires balancing test per GDPR Article 6(1)(f). Must assess controller interests against data subject rights.',
      complianceMessage: 'Legitimate interests assessment properly conducted.',
      parameters: {
        balancing_test_factors: [
          'controller_legitimate_interests', 'necessity_of_processing',
          'impact_on_data_subjects', 'reasonable_expectations',
          'additional_safeguards'
        ]
      }
    },

    // ARTICLE 7 - CONDITIONS FOR CONSENT
    {
      rule_id: 'gdpr_valid_consent',
      name: 'Valid Consent Requirements',
      description: 'Ensure consent meets GDPR requirements',
      condition: 'lawful_basis == "consent"',
      action: 'escalate',
      priority: 100,
      legalBasis: 'GDPR Article 7 - Conditions for consent',
      violationMessage: 'Consent must be freely given, specific, informed, and unambiguous per GDPR Article 7. Must be able to demonstrate valid consent.',
      complianceMessage: 'Valid consent obtained according to GDPR requirements.',
      parameters: {
        consent_requirements: [
          'freely_given', 'specific', 'informed', 'unambiguous',
          'clear_affirmative_action', 'separate_from_other_matters'
        ]
      }
    },
    {
      rule_id: 'gdpr_consent_withdrawal',
      name: 'Consent Withdrawal Mechanism',
      description: 'Provide easy consent withdrawal mechanism',
      condition: 'lawful_basis == "consent"',
      action: 'alert',
      priority: 90,
      legalBasis: 'GDPR Article 7(3) - Withdrawal of consent',
      violationMessage: 'Data subjects must be able to withdraw consent easily per GDPR Article 7(3). Withdrawal must be as easy as giving consent.',
      complianceMessage: 'Consent withdrawal mechanism properly implemented.',
      parameters: {
        withdrawal_requirements: [
          'easy_withdrawal_mechanism', 'clear_instructions',
          'no_detriment_for_withdrawal', 'prompt_processing_of_withdrawal'
        ]
      }
    },

    // CHAPTER III - RIGHTS OF THE DATA SUBJECT (Articles 12-23)
    {
      rule_id: 'gdpr_transparent_information',
      name: 'Transparent Information and Communication',
      description: 'Provide transparent information to data subjects',
      condition: 'collecting_personal_data == true',
      action: 'alert',
      priority: 90,
      legalBasis: 'GDPR Article 12 - Transparent information, communication and modalities',
      violationMessage: 'Must provide transparent information to data subjects per GDPR Article 12. Information must be concise, easily accessible, and in plain language.',
      complianceMessage: 'Transparent information properly provided to data subjects.',
      parameters: {
        information_requirements: [
          'concise_information', 'transparent_information', 'intelligible_information',
          'easily_accessible', 'plain_language', 'clear_language'
        ]
      }
    },
    {
      rule_id: 'gdpr_information_collection',
      name: 'Information When Collecting from Data Subject',
      description: 'Provide required information when collecting data directly',
      condition: 'collecting_data_directly == true',
      action: 'alert',
      priority: 95,
      legalBasis: 'GDPR Article 13 - Information to be provided where personal data are collected from the data subject',
      violationMessage: 'Must provide required information when collecting data directly per GDPR Article 13. Must include identity, purposes, legal basis, and rights.',
      complianceMessage: 'Required information provided when collecting data from data subject.',
      parameters: {
        required_information: [
          'controller_identity', 'dpo_contact_details', 'purposes_of_processing',
          'legal_basis', 'legitimate_interests', 'recipients', 'third_country_transfers',
          'retention_period', 'data_subject_rights', 'right_to_withdraw_consent',
          'right_to_lodge_complaint', 'source_of_data', 'automated_decision_making'
        ]
      }
    },
    {
      rule_id: 'gdpr_information_not_obtained',
      name: 'Information When Not Collecting from Data Subject',
      description: 'Provide required information when obtaining data indirectly',
      condition: 'collecting_data_indirectly == true',
      action: 'alert',
      priority: 95,
      legalBasis: 'GDPR Article 14 - Information to be provided where personal data have not been obtained from the data subject',
      violationMessage: 'Must provide required information when obtaining data indirectly per GDPR Article 14. Must provide within reasonable period, maximum 1 month.',
      complianceMessage: 'Required information provided for indirectly obtained data.',
      parameters: {
        provision_timeframe: '1_month_maximum',
        required_information: [
          'controller_identity', 'dpo_contact_details', 'purposes_of_processing',
          'legal_basis', 'categories_of_personal_data', 'recipients',
          'third_country_transfers', 'retention_period', 'data_subject_rights',
          'source_of_data', 'automated_decision_making'
        ]
      }
    },
    {
      rule_id: 'gdpr_right_of_access',
      name: 'Right of Access',
      description: 'Provide access to personal data upon request',
      condition: 'data_subject_access_request == true',
      action: 'escalate',
      priority: 95,
      legalBasis: 'GDPR Article 15 - Right of access by the data subject',
      violationMessage: 'Must provide access to personal data within 1 month per GDPR Article 15. Must confirm processing and provide copy of data.',
      complianceMessage: 'Data subject access request properly processed.',
      parameters: {
        response_timeframe: '1_month',
        extension_possible: '2_additional_months',
        information_to_provide: [
          'confirmation_of_processing', 'purposes_of_processing', 'categories_of_data',
          'recipients', 'retention_period', 'data_subject_rights', 'source_of_data',
          'automated_decision_making', 'safeguards_for_transfers'
        ]
      }
    },
    {
      rule_id: 'gdpr_right_to_rectification',
      name: 'Right to Rectification',
      description: 'Rectify inaccurate personal data upon request',
      condition: 'rectification_request == true',
      action: 'escalate',
      priority: 90,
      legalBasis: 'GDPR Article 16 - Right to rectification',
      violationMessage: 'Must rectify inaccurate personal data without undue delay per GDPR Article 16. Must complete incomplete data.',
      complianceMessage: 'Personal data rectification properly processed.',
      parameters: {
        response_timeframe: 'without_undue_delay',
        rectification_scope: ['inaccurate_data', 'incomplete_data'],
        notification_required: 'recipients_of_data'
      }
    },
    {
      rule_id: 'gdpr_right_to_erasure',
      name: 'Right to Erasure (Right to be Forgotten)',
      description: 'Erase personal data upon request when grounds apply',
      condition: 'erasure_request == true',
      action: 'escalate',
      priority: 90,
      legalBasis: 'GDPR Article 17 - Right to erasure (right to be forgotten)',
      violationMessage: 'Must erase personal data without undue delay when grounds apply per GDPR Article 17. Must assess if erasure grounds are met.',
      complianceMessage: 'Personal data erasure request properly processed.',
      parameters: {
        erasure_grounds: [
          'no_longer_necessary', 'consent_withdrawn', 'unlawful_processing',
          'legal_obligation', 'child_consent', 'public_interest_objection'
        ],
        exceptions: [
          'freedom_of_expression', 'legal_obligation', 'public_interest',
          'archiving_research_statistics', 'legal_claims'
        ]
      }
    },
    {
      rule_id: 'gdpr_right_to_restrict_processing',
      name: 'Right to Restriction of Processing',
      description: 'Restrict processing upon request when grounds apply',
      condition: 'restriction_request == true',
      action: 'escalate',
      priority: 85,
      legalBasis: 'GDPR Article 18 - Right to restriction of processing',
      violationMessage: 'Must restrict processing when grounds apply per GDPR Article 18. Data can only be stored or processed with consent.',
      complianceMessage: 'Processing restriction request properly handled.',
      parameters: {
        restriction_grounds: [
          'accuracy_contested', 'unlawful_processing', 'no_longer_needed_but_required_for_claims',
          'objection_pending_verification'
        ]
      }
    },
    {
      rule_id: 'gdpr_notification_obligation',
      name: 'Notification of Rectification, Erasure, or Restriction',
      description: 'Notify recipients of rectification, erasure, or restriction',
      condition: 'rectification_completed == true OR erasure_completed == true OR restriction_completed == true',
      action: 'escalate',
      priority: 80,
      legalBasis: 'GDPR Article 19 - Notification obligation regarding rectification or erasure of personal data or restriction of processing',
      violationMessage: 'Must notify recipients of rectification, erasure, or restriction per GDPR Article 19, unless impossible or disproportionate effort.',
      complianceMessage: 'Recipients properly notified of data changes.',
      parameters: {
        notification_required: 'all_recipients',
        exception: 'impossible_or_disproportionate_effort'
      }
    },
    {
      rule_id: 'gdpr_right_to_data_portability',
      name: 'Right to Data Portability',
      description: 'Provide data in portable format upon request',
      condition: 'portability_request == true',
      action: 'escalate',
      priority: 85,
      legalBasis: 'GDPR Article 20 - Right to data portability',
      violationMessage: 'Must provide data in structured, commonly used, machine-readable format per GDPR Article 20 when processing based on consent or contract.',
      complianceMessage: 'Data portability request properly processed.',
      parameters: {
        applicable_when: ['consent_based_processing', 'contract_based_processing'],
        format_requirements: ['structured', 'commonly_used', 'machine_readable'],
        transmission_option: 'direct_transmission_where_technically_feasible'
      }
    },
    {
      rule_id: 'gdpr_right_to_object',
      name: 'Right to Object',
      description: 'Handle objections to processing',
      condition: 'objection_request == true',
      action: 'escalate',
      priority: 90,
      legalBasis: 'GDPR Article 21 - Right to object',
      violationMessage: 'Must stop processing upon objection per GDPR Article 21, unless compelling legitimate grounds override data subject interests.',
      complianceMessage: 'Objection to processing properly handled.',
      parameters: {
        objection_grounds: ['public_interest_or_legitimate_interests', 'direct_marketing'],
        assessment_required: 'compelling_legitimate_grounds',
        direct_marketing_exception: 'must_stop_immediately'
      }
    },
    {
      rule_id: 'gdpr_automated_decision_making',
      name: 'Automated Individual Decision-Making',
      description: 'Handle automated decision-making and profiling',
      condition: 'automated_decision_making == true OR profiling == true',
      action: 'escalate',
      priority: 90,
      legalBasis: 'GDPR Article 22 - Automated individual decision-making, including profiling',
      violationMessage: 'Automated decision-making with legal/significant effects prohibited per GDPR Article 22, unless explicit consent, contract necessity, or legal authorization.',
      complianceMessage: 'Automated decision-making properly governed.',
      parameters: {
        prohibited_unless: ['explicit_consent', 'contract_necessity', 'legal_authorization'],
        safeguards_required: ['human_intervention', 'express_point_of_view', 'contest_decision']
      }
    },

    // CHAPTER IV - CONTROLLER AND PROCESSOR (Articles 24-43)
    {
      rule_id: 'gdpr_accountability_principle',
      name: 'Accountability Principle',
      description: 'Demonstrate compliance with GDPR principles',
      condition: 'processing_personal_data == true',
      action: 'log',
      priority: 95,
      legalBasis: 'GDPR Article 5(2) - Accountability principle',
      violationMessage: 'Must demonstrate compliance with GDPR principles per Article 5(2). Must implement appropriate measures and maintain records.',
      complianceMessage: 'Accountability measures properly implemented.',
      parameters: {
        accountability_measures: [
          'privacy_policies', 'staff_training', 'regular_reviews',
          'documentation_of_processing', 'impact_assessments'
        ]
      }
    },
    {
      rule_id: 'gdpr_records_of_processing',
      name: 'Records of Processing Activities',
      description: 'Maintain records of processing activities',
      condition: 'processing_personal_data == true AND (employees >= 250 OR high_risk_processing == true)',
      action: 'log',
      priority: 85,
      legalBasis: 'GDPR Article 30 - Records of processing activities',
      violationMessage: 'Must maintain records of processing activities per GDPR Article 30. Records must include purposes, categories, recipients, transfers, and retention.',
      complianceMessage: 'Records of processing activities properly maintained.',
      parameters: {
        record_requirements: [
          'controller_processor_details', 'purposes_of_processing', 'categories_of_data_subjects',
          'categories_of_personal_data', 'recipients', 'third_country_transfers',
          'retention_periods', 'security_measures'
        ]
      }
    },
    {
      rule_id: 'gdpr_security_of_processing',
      name: 'Security of Processing',
      description: 'Implement appropriate technical and organisational measures',
      condition: 'processing_personal_data == true',
      action: 'encrypt',
      priority: 95,
      legalBasis: 'GDPR Article 32 - Security of processing',
      violationMessage: 'Must implement appropriate security measures per GDPR Article 32. Must consider state of art, costs, nature, scope, and risks.',
      complianceMessage: 'Appropriate security measures implemented for processing.',
      parameters: {
        security_measures: [
          'pseudonymisation_encryption', 'confidentiality_integrity_availability',
          'resilience_of_systems', 'restore_availability_after_incident',
          'regular_testing_evaluation'
        ]
      }
    },
    {
      rule_id: 'gdpr_personal_data_breach_notification',
      name: 'Personal Data Breach Notification',
      description: 'Notify supervisory authority of personal data breaches',
      condition: 'personal_data_breach == true',
      action: 'escalate',
      priority: 100,
      legalBasis: 'GDPR Article 33 - Notification of a personal data breach to the supervisory authority',
      violationMessage: 'Must notify supervisory authority of breach within 72 hours per GDPR Article 33, unless unlikely to result in risk to rights and freedoms.',
      complianceMessage: 'Personal data breach notification properly initiated.',
      parameters: {
        notification_timeframe: '72_hours',
        risk_threshold: 'likely_to_result_in_risk_to_rights_and_freedoms',
        notification_content: [
          'nature_of_breach', 'categories_and_numbers_affected', 'dpo_contact',
          'likely_consequences', 'measures_taken_or_proposed'
        ]
      }
    },
    {
      rule_id: 'gdpr_breach_communication_data_subject',
      name: 'Breach Communication to Data Subject',
      description: 'Communicate breaches to affected data subjects',
      condition: 'personal_data_breach == true AND high_risk_to_rights_freedoms == true',
      action: 'escalate',
      priority: 95,
      legalBasis: 'GDPR Article 34 - Communication of a personal data breach to the data subject',
      violationMessage: 'Must communicate breach to data subjects when high risk per GDPR Article 34. Communication must be in clear and plain language.',
      complianceMessage: 'Breach communication to data subjects properly executed.',
      parameters: {
        communication_threshold: 'high_risk_to_rights_and_freedoms',
        communication_content: [
          'nature_of_breach', 'dpo_contact', 'likely_consequences',
          'measures_taken_or_proposed'
        ],
        exceptions: [
          'appropriate_technical_organisational_protection_measures',
          'subsequent_measures_ensure_high_risk_no_longer_likely',
          'disproportionate_effort'
        ]
      }
    },
    {
      rule_id: 'gdpr_data_protection_impact_assessment',
      name: 'Data Protection Impact Assessment',
      description: 'Conduct DPIA for high-risk processing',
      condition: 'high_risk_processing == true',
      action: 'escalate',
      priority: 90,
      legalBasis: 'GDPR Article 35 - Data protection impact assessment',
      violationMessage: 'Must conduct DPIA for high-risk processing per GDPR Article 35. Required for systematic monitoring, large-scale special categories, or innovative technology.',
      complianceMessage: 'Data Protection Impact Assessment properly conducted.',
      parameters: {
        dpia_triggers: [
          'systematic_comprehensive_evaluation', 'large_scale_special_categories',
          'systematic_monitoring_public_areas', 'innovative_technology'
        ],
        dpia_content: [
          'description_of_processing', 'purposes_and_legitimate_interests',
          'assessment_of_necessity_proportionality', 'assessment_of_risks',
          'measures_to_address_risks'
        ]
      }
    }
  ],
  
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'system',
  compliance_mappings: {
    'GDPR': [
      'Article_5', 'Article_6', 'Article_7', 'Article_12', 'Article_13', 'Article_14',
      'Article_15', 'Article_16', 'Article_17', 'Article_18', 'Article_19', 'Article_20',
      'Article_21', 'Article_22', 'Article_30', 'Article_32', 'Article_33', 'Article_34', 'Article_35'
    ],
    'National_Implementations': [
      'UK_DPA_2018', 'German_BDSG', 'French_Data_Protection_Act', 'Irish_DPA_2018'
    ],
    'Related_Regulations': ['ePrivacy_Directive', 'NIS_Directive', 'Cybersecurity_Act']
  }
};

// Export comprehensive policies to replace the basic ones
export const COMPREHENSIVE_POLICIES = [
  COMPREHENSIVE_HIPAA_POLICY,
  COMPREHENSIVE_SOX_POLICY,
  COMPREHENSIVE_GDPR_POLICY
];

