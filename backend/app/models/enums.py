from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    POLICE_OFFICER = "police_officer"
    INVESTIGATION_OFFICER = "investigation_officer"
    LAWYER = "lawyer"
    PUBLIC = "public"


class CaseStatus(str, Enum):
    OPEN = "open"
    UNDER_INVESTIGATION = "under_investigation"
    CLOSED = "closed"
    ARCHIVED = "archived"


class EvidenceType(str, Enum):
    PHYSICAL = "physical"
    DIGITAL = "digital"
    DOCUMENTARY = "documentary"
    TESTIMONIAL = "testimonial"
    FORENSIC = "forensic"


class NodeType(str, Enum):
    SUSPECT = "suspect"
    VICTIM = "victim"
    WITNESS = "witness"
    EVIDENCE = "evidence"
    CASE = "case"
    LOCATION = "location"
    ORGANIZATION = "organization"


class RelationshipType(str, Enum):
    CONNECTED_TO = "connected_to"
    WITNESSED = "witnessed"
    VICTIM_OF = "victim_of"
    SUSPECT_IN = "suspect_in"
    LINKED_TO = "linked_to"
    LOCATED_AT = "located_at"
    PART_OF = "part_of"
    ASSOCIATED_WITH = "associated_with"


class DocumentType(str, Enum):
    IPC = "ipc"
    CRPC = "crpc"
    EVIDENCE_ACT = "evidence_act"
    CONSTITUTION = "constitution"
    SPECIAL_ACT = "special_act"
    CASE_LAW = "case_law"
    PROCEDURE = "procedure"
    OTHER = "other"


class ReportType(str, Enum):
    INVESTIGATION = "investigation"
    LEGAL_ANALYSIS = "legal_analysis"
    EVIDENCE_SUMMARY = "evidence_summary"
    CASE_SUMMARY = "case_summary"


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
