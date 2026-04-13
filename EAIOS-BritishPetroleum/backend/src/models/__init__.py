# Import all models so SQLAlchemy mapper registry and Alembic autogenerate
# can discover every table. Order matters for FK resolution.
from .database import Base  # noqa: F401
from .core import Site, User, Equipment, SensorReading  # noqa: F401
from .alerts import Alert, AlertShapSignal, AlertAnalogue, AlertDecision, AuditLog  # noqa: F401
from .work_orders import WorkOrder, SapBapiRecord, WoPart, CrewMember, CrewAssignment  # noqa: F401
from .spare_parts import SparePart, SparePartStock, ProcurementOrder  # noqa: F401
from .ml_models import (MLModel, ModelDriftMetric, ShapFeatureImportance,  # noqa: F401
                         ModelFeedback, ActiveLearningQueue, RetrainingRun)
from .digital_twin import DigitalTwinAsset, OperatingEnvelopeParam, TwinScenario  # noqa: F401
from .ot_data import OTDataSource, OTQualityIssue, SchemaNormalizationLog  # noqa: F401
from .tar import TurnaroundEvent, TarTask, MaintenanceScheduleRecommendation, TarConstraint  # noqa: F401
from .roi import KpiSnapshot, RoiContribution, BudgetActual, CostSavingEvent  # noqa: F401
from .compliance import (ComplianceStandard, ComplianceAudit, ComplianceEvidence,  # noqa: F401
                          RegulatoryChange, ComplianceAction)
from .energy import EnergyReading, EnergyTarget, EnergySavingEvent  # noqa: F401
from .field_ops import InspectionRoute, InspectionItem, Contractor  # noqa: F401
from .castrol import (BlendSpecification, BlendRun, BlendSensorReading,  # noqa: F401
                       BlendQualityPrediction, LimsResult)
from .offshore import (OffshorePlatform, WeatherForecast, SubseaAlert,  # noqa: F401
                        WellIntegrity, VesselSchedule)
from .adoption import (AdoptionMetric, TrainingModule, TrainingEnrollment,  # noqa: F401
                        AdoptionBarrier, ChangeChampion)
from .wave_tracker import ImplementationWave, WaveMilestone, DeliveryRisk  # noqa: F401
from .edge_ai import EdgeNode, EdgeModelDeployment, LatencyBenchmark  # noqa: F401
