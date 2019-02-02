import ava from 'ava';
import sinon from 'sinon';
import _isArray from 'lodash/isArray';
import _isObject from 'lodash/isObject';
import AircraftModel from '../../../src/assets/scripts/client/aircraft/AircraftModel';
import ModeController from '../../../src/assets/scripts/client/aircraft/ModeControl/ModeController';
import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import {
    ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK,
    DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK
} from '../_mocks/aircraftMocks';
import {
    createFmsArrivalFixture,
    createFmsDepartureFixture,
    createModeControllerFixture
} from '../../fixtures/aircraftFixtures';
import { airportModelFixture } from '../../fixtures/airportFixtures';
import { createNavigationLibraryFixture } from '../../fixtures/navigationLibraryFixtures';
import { INVALID_NUMBER } from '../../../src/assets/scripts/client/constants/globalConstants';

// mocks
const airportElevationMock = 11;
const airportIcaoMock = 'KLAS';
const airportNameMock = 'McCarran International Airport';
const runwayNameMock = '19L';
const runwayModelMock = airportModelFixture.getRunway(runwayNameMock);
const approachTypeMock = 'ils';

const validRouteStringMock = 'DAG.KEPEC3.KLAS07R';
const complexRouteString = 'COWBY..BIKKR..DAG.KEPEC3.KLAS01L';
const amendRouteString = 'DAG..HOLDM..PRINO';
const invalidRouteString = 'A..B.C.D';
const invalidAmendRouteString = 'A..B..C';
const sidIdMock = 'COWBY6';
const waypointNameMock = 'SUNST';
const holdParametersMock = {
    inboundHeading: -1.62476729292438,
    legLength: '1min',
    turnDirection: 'right'
};

const headingMock = 3.141592653589793;
const nextHeadingDegreesMock = 180;

const speedMock = 190;
const cruiseSpeedMock = 460;
const unattainableSpeedMock = 530;

const initialAltitudeMock = 18000;
const nextAltitudeMock = 5000;
const invalidAltitudeMock = 'threeve';

// helpers
function createPilotFixture() {
    return new Pilot(createFmsArrivalFixture(), createModeControllerFixture());
}

function buildPilotWithComplexRoute() {
    const pilot = createPilotFixture();

    pilot.replaceFlightPlanWithNewRoute(complexRouteString);

    return pilot;
}

ava('throws when instantiated without parameters', (t) => {
    t.throws(() => new Pilot());
    t.throws(() => new Pilot({}));
    t.throws(() => new Pilot([]));
    t.throws(() => new Pilot('threeve'));
    t.throws(() => new Pilot(42));
    t.throws(() => new Pilot(false));
    t.throws(() => new Pilot(null, createModeControllerFixture()));
    t.throws(() => new Pilot('', createModeControllerFixture()));
    t.throws(() => new Pilot({}, createModeControllerFixture()));
    t.throws(() => new Pilot(createFmsArrivalFixture(), {}));
});

ava('does not throw when passed valid parameters', (t) => {
    t.notThrows(() => createPilotFixture());
});

ava('.shouldExpediteAltitudeChange() sets #shouldExpediteAltitudeChange to true and responds with a success message', (t) => {
    const expectedResult = [true, 'expediting to assigned altitude'];
    const pilot = createPilotFixture();
    const result = pilot.shouldExpediteAltitudeChange();

    t.true(pilot._mcp.shouldExpediteAltitudeChange);
    t.deepEqual(result, expectedResult);
});

ava('.applyArrivalProcedure() returns an error when passed an invalid routeString', (t) => {
    const expectedResult = [false, 'arrival procedure format not understood'];
    const pilot = createPilotFixture();
    const result = pilot.applyArrivalProcedure('~!@#$%', airportNameMock);

    t.deepEqual(result, expectedResult);
});

ava('.applyArrivalProcedure() returns an error when passed an invalid procedure name', (t) => {
    const invalidRouteStringMock = 'DAG.~!@#$.KLAS';
    const expectedResult = [false, 'unknown procedure "~!@#$"'];
    const pilot = createPilotFixture();
    const result = pilot.applyArrivalProcedure(invalidRouteStringMock, airportNameMock);

    t.deepEqual(result, expectedResult);
});

ava('.applyArrivalProcedure() returns an error when passed a procedure with an invaild entry', (t) => {
    const invalidRouteStringMock = 'a.KEPEC3.KLAS';
    const expectedResult = [false, 'route of "a.KEPEC3.KLAS" is not valid'];
    const pilot = createPilotFixture();
    const result = pilot.applyArrivalProcedure(invalidRouteStringMock, airportNameMock);

    t.deepEqual(result, expectedResult);
});

ava('.applyArrivalProcedure() returns a success message after success', (t) => {
    const pilot = createPilotFixture();
    const result = pilot.applyArrivalProcedure(validRouteStringMock, airportNameMock);

    t.true(_isArray(result));
    t.true(result[0]);
    t.true(result[1].log === 'cleared to McCarran International Airport via the KEPEC3 arrival');
    t.true(result[1].say === 'cleared to McCarran International Airport via the KEPEC THREE arrival');
});

ava('.applyArrivalProcedure() calls #_fms.replaceArrivalProcedure() with the correct parameters', (t) => {
    const pilot = createPilotFixture();
    const replaceArrivalProcedureSpy = sinon.spy(pilot._fms, 'replaceArrivalProcedure');

    pilot.applyArrivalProcedure(validRouteStringMock, airportNameMock);

    t.true(replaceArrivalProcedureSpy.calledWithExactly(validRouteStringMock));
});

ava('.applyDepartureProcedure() returns an error when passed an invalid sidId', (t) => {
    const procedureName = '~!@#$%';
    const expectedResult = [false, 'unknown procedure "~!@#$%"'];
    const pilot = new Pilot(createFmsDepartureFixture(), createModeControllerFixture(), createNavigationLibraryFixture());
    const result = pilot.applyDepartureProcedure(procedureName, airportIcaoMock);

    t.deepEqual(result, expectedResult);
    t.false(pilot.hasDepartureClearance);
});

ava('.applyDepartureProcedure() returns an error when passed an invalid runway', (t) => {
    const routeString = 'EDDF30R.COWBY6.GUP';
    const expectedResult = [false, 'requested route of "EDDF30R.COWBY6.GUP" is invalid'];
    const pilot = new Pilot(createFmsDepartureFixture(), createModeControllerFixture(), createNavigationLibraryFixture());
    const result = pilot.applyDepartureProcedure(routeString, airportIcaoMock);

    t.deepEqual(result, expectedResult);
    t.false(pilot.hasDepartureClearance);
});

ava('.applyDepartureProcedure() should NOT change mcp modes', (t) => {
    const pilot = new Pilot(createFmsDepartureFixture(), createModeControllerFixture(), createNavigationLibraryFixture());
    const mcp = pilot._mcp;
    const expectedAltitudeMode = mcp.altitudeMode;
    const expectedSpeedMode = mcp.speedMode;

    pilot.applyDepartureProcedure(sidIdMock, airportIcaoMock);

    // workaround: t.true(pilot._mcp..altitudeMode) causes out of memory crash
    t.true(mcp.altitudeMode === expectedAltitudeMode);
    t.true(mcp.speedMode === expectedSpeedMode);
});

ava('.applyDepartureProcedure() returns a success message after success', (t) => {
    const pilot = new Pilot(createFmsDepartureFixture(), createModeControllerFixture(), createNavigationLibraryFixture());
    const result = pilot.applyDepartureProcedure(sidIdMock, airportIcaoMock);

    t.true(_isArray(result));
    t.true(result[0]);
    t.true(result[1].log === 'cleared to destination via the COWBY6 departure, then as filed');
    t.true(result[1].say === 'cleared to destination via the COWBOY SIX departure, then as filed');
});

ava('.replaceFlightPlanWithNewRoute() returns an error when passed an invalid route', (t) => {
    const expectedResult = [
        false,
        {
            log: 'requested route of "a..b.c.d" is invalid',
            say: 'that route is invalid'
        }
    ];
    const pilot = createPilotFixture();
    const result = pilot.replaceFlightPlanWithNewRoute('a..b.c.d');

    t.deepEqual(result, expectedResult);
});

ava('.replaceFlightPlanWithNewRoute() removes an existing route and replaces it with a new one', (t) => {
    const pilot = createPilotFixture();

    pilot.replaceFlightPlanWithNewRoute('COWBY..BIKKR');

    t.true(pilot._fms.currentWaypoint.name === 'COWBY');
});

ava.todo('.replaceFlightPlanWithNewRoute() replaces old route with new one, and skips ahead to the old current waypoint');

ava('.replaceFlightPlanWithNewRoute() returns a success message when finished successfully', (t) => {
    const expectedResult = [
        true,
        {
            log: 'rerouting to: COWBY BIKKR',
            say: 'rerouting as requested'
        }
    ];
    const pilot = createPilotFixture();
    const result = pilot.replaceFlightPlanWithNewRoute('COWBY..BIKKR');

    t.deepEqual(result, expectedResult);
});

ava('.applyPartialRouteAmendment() returns an error with passed an invalid routeString', (t) => {
    const expectedResult = [false, 'requested route of "A..B.C.D" is invalid'];
    const pilot = buildPilotWithComplexRoute();
    const result = pilot.applyPartialRouteAmendment(invalidRouteString);

    t.deepEqual(result, expectedResult);
});

ava('.applyPartialRouteAmendment() returns an error with passed a routeString without a shared waypoint', (t) => {
    const expectedResult = [false, 'routes do not have continuity!'];
    const pilot = buildPilotWithComplexRoute();
    const result = pilot.applyPartialRouteAmendment('HITME..HOLDM');

    t.deepEqual(result, expectedResult);
});

ava('.applyPartialRouteAmendment() returns a success message when complete', (t) => {
    const expectedResult = [
        true,
        {
            log: 'rerouting to: DAG HOLDM PRINO',
            say: 'rerouting as requested'
        }
    ];
    const pilot = buildPilotWithComplexRoute();
    const result = pilot.applyPartialRouteAmendment(amendRouteString);

    t.deepEqual(result, expectedResult);
});

ava('.applyPartialRouteAmendment() calls #_fms.applyPartialRouteAmendment()', (t) => {
    const pilot = buildPilotWithComplexRoute();
    const fmsApplyPartialRouteAmendmentSpy = sinon.spy(pilot._fms, 'applyPartialRouteAmendment');
    const expectedResult = [
        true,
        {
            log: 'rerouting to: DAG HOLDM PRINO',
            say: 'rerouting as requested'
        }
    ];
    const result = pilot.applyPartialRouteAmendment(amendRouteString);

    t.true(fmsApplyPartialRouteAmendmentSpy.calledWithExactly(amendRouteString));
    t.deepEqual(result, expectedResult);
});

ava('.applyPartialRouteAmendment() does not grant departure clearance when the route amendment fails', (t) => {
    const pilot = buildPilotWithComplexRoute();

    pilot.hasDepartureClearance = false;
    t.false(pilot.hasDepartureClearance);

    const expectedResult = [false, `requested route of "${invalidAmendRouteString}" is invalid`];
    const result = pilot.applyPartialRouteAmendment(invalidAmendRouteString);

    t.deepEqual(result, expectedResult);
    t.false(pilot.hasDepartureClearance);
});

ava('.applyPartialRouteAmendment() grants departure clearance when the route amendment succeeds', (t) => {
    const pilot = buildPilotWithComplexRoute();

    pilot.hasDepartureClearance = false;
    t.false(pilot.hasDepartureClearance);

    const expectedResult = [true,
        {
            log: 'rerouting to: DAG HOLDM PRINO',
            say: 'rerouting as requested'
        }
    ];
    const result = pilot.applyPartialRouteAmendment(amendRouteString);

    t.deepEqual(result, expectedResult);

    // workaround: t.true(pilot.hasDepartureClearance) causes out of memory crash
    const departureClearance = pilot.hasDepartureClearance;
    t.true(departureClearance);
});

ava('.applyPartialRouteAmendment() calls .exitHold()', (t) => {
    const pilot = buildPilotWithComplexRoute();
    const exitHoldSpy = sinon.spy(pilot, 'exitHold');

    pilot.initiateHoldingPattern('MISEN', holdParametersMock);
    pilot.applyPartialRouteAmendment(amendRouteString);

    t.true(exitHoldSpy.calledWithExactly());
});

ava('.cancelApproachClearance() returns early if #hasApproachClearance is false', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());
    const result = aircraftModel.pilot.cancelApproachClearance(aircraftModel);
    const expectedResult = [false, 'we have no approach clearance to cancel!'];

    t.deepEqual(result, expectedResult);
});

ava('.cancelApproachClearance() sets the correct modes and values in the Mcp', (t) => {
    const nextAltitudeMock = 4000;
    const nextHeadingDegreesMock = 250;
    const shouldExpediteDescentMock = false;
    const shouldUseSoftCeilingMock = false;
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());

    aircraftModel.pilot.maintainAltitude(
        nextAltitudeMock,
        shouldExpediteDescentMock,
        shouldUseSoftCeilingMock,
        airportModelFixture,
        aircraftModel
    );
    aircraftModel.pilot.maintainHeading(aircraftModel, nextHeadingDegreesMock, null, false);
    aircraftModel.pilot.maintainSpeed(speedMock, aircraftModel);
    aircraftModel.pilot.conductInstrumentApproach(aircraftModel, approachTypeMock, runwayModelMock);
    aircraftModel.pilot.cancelApproachClearance(aircraftModel);

    t.true(aircraftModel.pilot._mcp.altitudeMode === 'HOLD');
    t.true(aircraftModel.pilot._mcp.altitude === nextAltitudeMock);
    t.true(aircraftModel.pilot._mcp.headingMode === 'HOLD');
    t.true(aircraftModel.pilot._mcp.heading === aircraftModel.heading);
    t.true(aircraftModel.pilot._mcp.speedMode === 'HOLD');
    t.true(aircraftModel.pilot._mcp.speed === speedMock);
});

ava('.cancelApproachClearance() returns a success message when finished', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());
    const expectedResult = [
        true,
        'cancel approach clearance, fly present heading, maintain last assigned altitude and speed'
    ];

    aircraftModel.pilot.conductInstrumentApproach(aircraftModel, approachTypeMock, runwayModelMock);

    const result = aircraftModel.pilot.cancelApproachClearance(aircraftModel);

    t.deepEqual(result, expectedResult);
});

ava('.cancelApproachClearance() sets #hasApproachClearance to false', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());

    aircraftModel.pilot.hasApproachClearance = true;

    aircraftModel.pilot.cancelApproachClearance(aircraftModel);

    t.false(aircraftModel.pilot.hasApproachClearance);
});

ava('.clearedAsFiled() grants pilot departure clearance and returns the correct response strings', (t) => {
    const aircraftModel = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());
    const result = aircraftModel.pilot.clearedAsFiled();

    t.true(_isArray(result));
    t.true(result[0] === true);
    t.true(_isObject(result[1]));
    t.true(result[1].log === 'cleared to destination as filed');
    t.true(result[1].say === 'cleared to destination as filed');
    t.true(aircraftModel.pilot.hasDepartureClearance === true);
});

ava('.climbViaSID() returns error response if #flightPlanAltitude has not been set', (t) => {
    const expectedResult = [false, 'unable, no altitude assigned'];
    const aircraftModel = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK);
    aircraftModel.altitude = 0;
    const pilot = new Pilot(createFmsDepartureFixture(), createModeControllerFixture(), createNavigationLibraryFixture());
    const previousFlightPlanAltitude = pilot._fms.flightPlanAltitude;
    pilot._fms.flightPlanAltitude = INVALID_NUMBER;

    const result = pilot.climbViaSid(aircraftModel);

    t.deepEqual(result, expectedResult);

    pilot._fms.flightPlanAltitude = previousFlightPlanAltitude;
});

ava('.climbViaSID() returns early when the given altitude is below the aircraft\'s current altitude', (t) => {
    const aircraftModel = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK);
    aircraftModel.altitude = 5000;
    const pilot = createPilotFixture();
    const expectedResponse = [
        false,
        {
            log: 'unable to comply, say again',
            say: 'unable to comply, say again'
        }
    ];

    const response = pilot.climbViaSid(aircraftModel, 2000);
    t.deepEqual(response, expectedResponse);
});

ava('.climbViaSID() correctly configures MCP and returns correct response when no altitude is given', (t) => {
    const aircraftModel = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK);
    aircraftModel.altitude = 0;
    const pilot = new Pilot(createFmsDepartureFixture(), createModeControllerFixture(), createNavigationLibraryFixture());
    const expectedResponse = [
        true,
        {
            log: 'climb via SID and maintain 41000',
            say: 'climb via SID and maintain flight level four one zero'
        }
    ];

    const response = pilot.climbViaSid(aircraftModel);

    t.deepEqual(response, expectedResponse);
    t.true(pilot._mcp.altitudeMode === 'VNAV');
    t.true(pilot._mcp.speedMode === 'VNAV');
    t.true(pilot._mcp.altitude === 41000);
});

ava('.climbViaSID() correctly configures MCP and returns correct response when an altitude is given', (t) => {
    const aircraftModel = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK);
    aircraftModel.altitude = 0;
    const pilot = new Pilot(createFmsDepartureFixture(), createModeControllerFixture(), createNavigationLibraryFixture());
    const expectedResponse = [
        true,
        {
            log: 'climb via SID and maintain 11000',
            say: 'climb via SID and maintain one one thousand'
        }
    ];

    const response = pilot.climbViaSid(aircraftModel, 11000);

    t.deepEqual(response, expectedResponse);
    t.true(pilot._mcp.altitudeMode === 'VNAV');
    t.true(pilot._mcp.speedMode === 'VNAV');
    t.true(pilot._mcp.altitude === 11000);
});

ava('.crossFix() correctly configures MCP and returns correct response ', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const pilotFixture = createPilotFixture();
    const fixNameMock = 'SKEBR';
    const altitudeMock = 8000;
    const expectedResponse = [
        true,
        {
            log: 'crossing SKEBR at 8000',
            say: 'crossing SKEBR at eight thousand'
        }
    ];

    const waypointModel = pilotFixture._fms.findWaypoint(fixNameMock);
    const response = pilotFixture.crossFix(aircraftModel, fixNameMock, altitudeMock);

    t.deepEqual(response, expectedResponse);
    t.true(pilotFixture._mcp.altitudeMode === 'VNAV');
    t.true(pilotFixture._mcp.altitude === altitudeMock);
    t.true(waypointModel.altitudeMinimum === altitudeMock);
    t.true(waypointModel.altitudeMaximum === altitudeMock);
});

ava('.conductInstrumentApproach() returns failure message when no runway is provided', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());
    const expectedResult = [false, 'the specified runway does not exist'];
    const result = aircraftModel.pilot.conductInstrumentApproach(aircraftModel, approachTypeMock, null);

    t.deepEqual(result, expectedResult);
});

ava('.conductInstrumentApproach() returns failure message when assigned altitude is lower than minimum glideslope intercept altitude', (t) => {
    const expectedResult = [false, {
        log: 'unable ILS 19L, our assigned altitude is below the minimum glideslope ' +
        'intercept altitude, request climb to 3400',
        say: 'unable ILS one niner left, our assigned altitude is below the minimum ' +
        'glideslope intercept altitude, request climb to three thousand four hundred'
    }];
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());

    aircraftModel.mcp.setAltitudeFieldValue(1);

    const result = aircraftModel.pilot.conductInstrumentApproach(aircraftModel, approachTypeMock, runwayModelMock);

    t.deepEqual(result, expectedResult);
});

ava('.conductInstrumentApproach() calls .setArrivalRunway() with the runwayName', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());
    const setArrivalRunwaySpy = sinon.spy(aircraftModel.pilot._fms, 'setArrivalRunway');

    aircraftModel.pilot.conductInstrumentApproach(aircraftModel, approachTypeMock, runwayModelMock);

    t.true(setArrivalRunwaySpy.calledWithExactly(runwayModelMock));
});

ava('.conductInstrumentApproach() calls ._interceptCourse() with the correct properties', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());
    const _interceptCourseSpy = sinon.spy(aircraftModel.pilot, '_interceptCourse');

    aircraftModel.pilot.conductInstrumentApproach(aircraftModel, approachTypeMock, runwayModelMock);

    t.true(_interceptCourseSpy.calledWithExactly(runwayModelMock.positionModel, runwayModelMock.angle));
});

ava('.conductInstrumentApproach() calls ._interceptGlidepath() with the correct properties', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());
    const _interceptGlidepathSpy = sinon.spy(aircraftModel.pilot, '_interceptGlidepath');

    aircraftModel.pilot.conductInstrumentApproach(aircraftModel, approachTypeMock, runwayModelMock);

    t.true(_interceptGlidepathSpy.calledWithExactly(
        runwayModelMock.positionModel,
        runwayModelMock.angle,
        runwayModelMock.ils.glideslopeGradient
    ));
});

ava('.conductInstrumentApproach() calls .exitHold', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());
    const exitHoldSpy = sinon.spy(aircraftModel.pilot, 'exitHold');

    aircraftModel.pilot._fms.setFlightPhase('HOLD');
    aircraftModel.pilot.conductInstrumentApproach(aircraftModel, approachTypeMock, runwayModelMock);

    t.true(exitHoldSpy.calledWithExactly());
});

ava('.conductInstrumentApproach() sets #hasApproachClearance to true', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());
    aircraftModel.pilot.conductInstrumentApproach(aircraftModel, approachTypeMock, runwayModelMock);

    t.true(aircraftModel.pilot.hasApproachClearance);
});

ava('.conductInstrumentApproach() returns a success message', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());
    const expectedResult = [
        true,
        {
            log: 'cleared ILS runway 19L approach',
            say: 'cleared ILS runway one niner left approach'
        }
    ];
    const result = aircraftModel.pilot.conductInstrumentApproach(aircraftModel, approachTypeMock, runwayModelMock);

    t.deepEqual(result, expectedResult);
});

ava('.descendViaStar() returns early when provided bottom altitude parameter is invalid', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const pilot = createPilotFixture();

    pilot._mcp.setAltitudeFieldValue(initialAltitudeMock);
    pilot._mcp.setAltitudeHold();

    const expectedResponse = [false, 'unable to descend to bottom altitude of threeve'];
    const response = pilot.descendViaStar(aircraftModel, invalidAltitudeMock);

    t.deepEqual(response, expectedResponse);
    t.true(pilot._mcp.altitude === initialAltitudeMock);
});

ava('.descendViaStar() returns early when no bottom altitude param provided and FMS has no bottom altitude', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const pilot = createPilotFixture();
    const failureResponseMock = [false, 'unable to descend via STAR'];

    pilot._mcp.setAltitudeFieldValue(initialAltitudeMock);
    pilot._mcp.setAltitudeHold();

    // replace route with one that will have NO altitude restrictions whatsoever
    pilot.replaceFlightPlanWithNewRoute('DAG..MISEN..CLARR..SKEBR..KEPEC..IPUMY..NIPZO..SUNST');

    const response = pilot.descendViaStar(aircraftModel);

    t.deepEqual(response, failureResponseMock);
    t.true(pilot._mcp.altitude === initialAltitudeMock);
});

ava('.descendViaStar() returns early when no bottom altitude param provided and FMS bottom altitude is invalid', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const pilot = createPilotFixture();
    const failureResponseMock = [false, 'unable to descend via STAR'];

    pilot._mcp.setAltitudeFieldValue(initialAltitudeMock);
    pilot._mcp.setAltitudeHold();

    // replace route with one that will have NO altitude restrictions whatsoever
    pilot.replaceFlightPlanWithNewRoute('DAG..MISEN..CLARR..SKEBR..KEPEC..IPUMY..NIPZO..SUNST');

    pilot._fms.waypoints[2].altitudeMaximum = invalidAltitudeMock;

    const response = pilot.descendViaStar(aircraftModel);

    t.deepEqual(response, failureResponseMock);
    t.true(pilot._mcp.altitude === initialAltitudeMock);
});

ava('.descendViaStar() returns early when the bottom altitude is above the aircraft\'s current altitude', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const pilot = createPilotFixture();
    const expectedResponse = [
        false,
        {
            log: 'unable to comply, say again',
            say: 'unable to comply, say again'
        }
    ];

    const response = pilot.descendViaStar(aircraftModel, 31000);
    t.deepEqual(response, expectedResponse);
});

ava('.descendViaStar() correctly configures MCP when no bottom altitude parameter provided but FMS has valid bottom altitude', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const pilot = createPilotFixture();
    const expectedResponse = [
        true,
        {
            log: 'descend via STAR and maintain 8000',
            say: 'descend via STAR and maintain eight thousand'
        }
    ];

    pilot._mcp.setAltitudeFieldValue(initialAltitudeMock);
    pilot._mcp.setAltitudeHold();

    const response = pilot.descendViaStar(aircraftModel);

    t.deepEqual(response, expectedResponse);
    t.true(pilot._mcp.altitudeMode === 'VNAV');
    t.true(pilot._mcp.speedMode === 'VNAV');
    t.true(pilot._mcp.altitude === 8000);
});

ava('.descendViaStar() correctly configures MCP when provided valid bottom altitude parameter', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const pilot = createPilotFixture();
    const expectedResponse = [
        true,
        {
            log: 'descend via STAR and maintain 5000',
            say: 'descend via STAR and maintain five thousand'
        }
    ];

    pilot._mcp.setAltitudeFieldValue(initialAltitudeMock);
    pilot._mcp.setAltitudeHold();

    const response = pilot.descendViaStar(aircraftModel, nextAltitudeMock);

    t.deepEqual(response, expectedResponse);
    t.true(pilot._mcp.altitudeMode === 'VNAV');
    t.true(pilot._mcp.altitude === nextAltitudeMock);
});

ava('.goAround() sets the correct Mcp modes and values', (t) => {
    const pilot = createPilotFixture();

    pilot.goAround(headingMock, speedMock, airportElevationMock);

    t.true(pilot._mcp.altitudeMode === 'HOLD');
    t.true(pilot._mcp.altitude === 1100);
    t.true(pilot._mcp.headingMode === 'HOLD');
    t.true(pilot._mcp.heading === headingMock);
    t.true(pilot._mcp.speedMode === 'HOLD');
    t.true(pilot._mcp.speed === 190);
});

ava('.goAround() returns a success message', (t) => {
    const expectedResult = [
        true,
        {
            log: 'go around, fly present heading, maintain 1100',
            say: 'go around, fly present heading, maintain one thousand one hundred'
        }
    ];
    const pilot = createPilotFixture();
    const result = pilot.goAround(headingMock, speedMock, airportElevationMock);

    t.deepEqual(result, expectedResult);
});

ava('.initiateHoldingPattern() returns error response when specified fix is not in the route', (t) => {
    const expectedResult = [false, 'unable to hold at COWBY; it is not on our route!'];
    const pilot = createPilotFixture();
    const result = pilot.initiateHoldingPattern('COWBY', holdParametersMock);

    t.deepEqual(result, expectedResult);
});

ava('.initiateHoldingPattern() returns correct readback when hold implemented successfully', (t) => {
    const expectedResult = [true, 'hold east of KEPEC, right turns, 1min legs'];
    const pilot = createPilotFixture();
    const result = pilot.initiateHoldingPattern('KEPEC', holdParametersMock);

    t.deepEqual(result, expectedResult);
});

ava('.maintainAltitude() returns early responding that they are unable to maintain the requested altitude', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const nextAltitudeMock = 90000;
    const shouldExpediteMock = false;
    const shouldUseSoftCeilingMock = true;
    const mcp = aircraftModel.mcp;
    const expectedAltitude = mcp.altitude;
    const expectedResult = [
        false,
        {
            log: 'unable to maintain 90000 due to performance',
            say: 'unable to maintain flight level niner zero zero due to performance'
        }
    ];

    const result = aircraftModel.pilot.maintainAltitude(
        nextAltitudeMock,
        shouldExpediteMock,
        shouldUseSoftCeilingMock,
        airportModelFixture,
        aircraftModel
    );

    t.true(mcp.altitudeMode === 'VNAV');
    t.true(mcp.altitude === expectedAltitude);
    t.deepEqual(result, expectedResult);
});

ava('.maintainAltitude() should set mcp.altitudeMode to `HOLD` and set mcp.altitude to the correct value', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const nextAltitudeMock = 13000;
    const shouldExpediteMock = false;
    const shouldUseSoftCeilingMock = false;

    aircraftModel.pilot.maintainAltitude(
        nextAltitudeMock,
        shouldExpediteMock,
        shouldUseSoftCeilingMock,
        airportModelFixture,
        aircraftModel
    );

    t.true(aircraftModel.mcp.altitudeMode === 'HOLD');
    t.true(aircraftModel.mcp.altitude === 13000);
});

ava('.maintainAltitude() calls .shouldExpediteAltitudeChange() when shouldExpedite is true', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const nextAltitudeMock = 13000;
    const shouldExpediteMock = true;
    const shouldUseSoftCeilingMock = false;
    const shouldExpediteAltitudeChangeSpy = sinon.spy(aircraftModel.pilot, 'shouldExpediteAltitudeChange');

    aircraftModel.pilot.maintainAltitude(
        nextAltitudeMock,
        shouldExpediteMock,
        shouldUseSoftCeilingMock,
        airportModelFixture,
        aircraftModel
    );

    t.true(shouldExpediteAltitudeChangeSpy.calledOnce);
});

ava('.maintainAltitude() returns the correct response strings when shouldExpedite is false', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const nextAltitudeMock = 13000;
    const shouldExpediteMock = false;
    const shouldUseSoftCeilingMock = false;

    const result = aircraftModel.pilot.maintainAltitude(
        nextAltitudeMock,
        shouldExpediteMock,
        shouldUseSoftCeilingMock,
        airportModelFixture,
        aircraftModel
    );

    t.true(_isArray(result));
    t.true(result[0] === true);
    t.true(_isObject(result[1]));
    t.true(result[1].log === 'descend and maintain 13000');
    t.true(result[1].say === 'descend and maintain one three thousand');
});

ava('.maintainAltitude() returns the correct response strings when shouldExpedite is true', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const nextAltitudeMock = 19000;
    const shouldExpediteMock = true;
    const shouldUseSoftCeilingMock = false;

    const result = aircraftModel.pilot.maintainAltitude(
        nextAltitudeMock,
        shouldExpediteMock,
        shouldUseSoftCeilingMock,
        airportModelFixture,
        aircraftModel
    );

    t.true(result[1].log === 'descend and maintain 19000 and expedite');
    t.true(result[1].say === 'descend and maintain flight level one niner zero and expedite');
});

ava('.maintainAltitude() calls .cancelApproachClearance()', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const approachTypeMock = 'ils';
    const runwayModelMock = airportModelFixture.getRunway('19L');
    const nextAltitudeMock = 13000;
    const shouldExpediteMock = false;
    const shouldUseSoftCeilingMock = false;
    const cancelApproachClearanceSpy = sinon.spy(aircraftModel.pilot, 'cancelApproachClearance');

    aircraftModel.pilot.conductInstrumentApproach(aircraftModel, approachTypeMock, runwayModelMock);

    t.true(aircraftModel.pilot.hasApproachClearance);

    aircraftModel.pilot.maintainAltitude(
        nextAltitudeMock,
        shouldExpediteMock,
        shouldUseSoftCeilingMock,
        airportModelFixture,
        aircraftModel
    );

    t.true(cancelApproachClearanceSpy.called);
});

ava('.maintainHeading() sets the #mcp with the correct modes and values', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);

    aircraftModel.pilot.maintainHeading(aircraftModel, nextHeadingDegreesMock, null, false);

    t.true(aircraftModel.pilot._mcp.headingMode === 'HOLD');
    t.true(aircraftModel.pilot._mcp.heading === 3.141592653589793);
});

ava('.maintainHeading() calls .exitHold()', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const exitHoldSpy = sinon.spy(aircraftModel.pilot, 'exitHold');

    aircraftModel.pilot._fms.setFlightPhase('HOLD');
    aircraftModel.pilot.maintainHeading(aircraftModel, nextHeadingDegreesMock, null, false);

    t.true(exitHoldSpy.calledWithExactly());
});

ava('.maintainHeading() returns a success message when incremental is false and no direction is provided', (t) => {
    const expectedResult = [
        true,
        {
            log: 'fly heading 180',
            say: 'fly heading one eight zero'
        }
    ];
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const result = aircraftModel.pilot.maintainHeading(aircraftModel, nextHeadingDegreesMock, null, false);

    t.deepEqual(result, expectedResult);
});

ava('.maintainHeading() returns a success message when incremental is true and direction is left', (t) => {
    const directionMock = 'left';
    const expectedResult = [
        true,
        {
            log: 'turn 42 degrees left',
            say: 'turn 42 degrees left'
        }
    ];
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const result = aircraftModel.pilot.maintainHeading(aircraftModel, 42, directionMock, true);

    t.deepEqual(result, expectedResult);
});

ava('.maintainHeading() returns a success message when incremental is true and direction is right', (t) => {
    const directionMock = 'right';
    const expectedResult = [
        true,
        {
            log: 'turn 42 degrees right',
            say: 'turn 42 degrees right'
        }
    ];
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const result = aircraftModel.pilot.maintainHeading(aircraftModel, 42, directionMock, true);

    t.deepEqual(result, expectedResult);
});

ava('.maintainHeading() calls .cancelApproachClearance()', (t) => {
    const approachTypeMock = 'ils';
    const runwayModelMock = airportModelFixture.getRunway('19L');
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const cancelApproachClearanceSpy = sinon.spy(aircraftModel.pilot, 'cancelApproachClearance');

    aircraftModel.pilot.conductInstrumentApproach(aircraftModel, approachTypeMock, runwayModelMock);

    t.true(aircraftModel.pilot.hasApproachClearance);

    aircraftModel.pilot.maintainHeading(aircraftModel, nextHeadingDegreesMock);

    t.true(cancelApproachClearanceSpy.called);
});

ava('.maintainPresentHeading() sets the #mcp with the correct modes and values', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);

    aircraftModel.pilot.maintainPresentHeading(aircraftModel);

    t.true(aircraftModel.pilot._mcp.headingMode === 'HOLD');
    t.true(aircraftModel.pilot._mcp.heading === aircraftModel.heading);
});

ava('.maintainPresentHeading() returns a success message when finished', (t) => {
    const expectedResult = [
        true,
        {
            log: 'fly present heading',
            say: 'fly present heading'
        }
    ];
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const result = aircraftModel.pilot.maintainPresentHeading(aircraftModel);

    t.deepEqual(result, expectedResult);
});

ava('.maintainPresentHeading() calls .cancelApproachClearance()', (t) => {
    const approachTypeMock = 'ils';
    const runwayModelMock = airportModelFixture.getRunway('19L');
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const cancelApproachClearanceSpy = sinon.spy(aircraftModel.pilot, 'cancelApproachClearance');

    aircraftModel.pilot.conductInstrumentApproach(aircraftModel, approachTypeMock, runwayModelMock);

    t.true(aircraftModel.pilot.hasApproachClearance);

    aircraftModel.pilot.maintainPresentHeading(aircraftModel);

    t.true(cancelApproachClearanceSpy.called);
});

ava('.maintainSpeed() sets the correct Mcp mode and value', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const pilot = createPilotFixture();
    const expectedResult = [
        true,
        {
            log: 'increase speed to 460',
            say: 'increase speed to four six zero'
        }
    ];
    const result = pilot.maintainSpeed(cruiseSpeedMock, aircraftModel);

    t.true(pilot._mcp.speedMode === 'HOLD');
    t.true(pilot._mcp.speed === 460);
    t.deepEqual(result, expectedResult);
});

ava('.maintainSpeed() returns early with a warning when assigned an unreachable speed', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const pilot = createPilotFixture();
    const expectedResult = [
        false,
        {
            log: 'unable to maintain 530 knots due to performance',
            say: 'unable to maintain five three zero knots due to performance'
        }
    ];
    const result = pilot.maintainSpeed(unattainableSpeedMock, aircraftModel);

    t.deepEqual(result, expectedResult);
});

ava('.proceedDirect() returns an error if the waypointName provided is not in the current flightPlan', (t) => {
    const expectedResult = [false, 'cannot proceed direct to ABC, it does not exist in our flight plan'];
    const pilot = createPilotFixture();
    const result = pilot.proceedDirect('ABC');

    t.deepEqual(result, expectedResult);
});

ava('.proceedDirect() calls ._fms.skipToWaypointName() with the correct arguments', (t) => {
    const pilot = createPilotFixture();
    const skipToWaypointNameSpy = sinon.spy(pilot._fms, 'skipToWaypointName');

    pilot.proceedDirect(waypointNameMock);

    t.true(skipToWaypointNameSpy.calledWithExactly(waypointNameMock));
});

ava('.proceedDirect() sets the correct #_mcp mode', (t) => {
    const pilot = createPilotFixture();

    pilot.proceedDirect(waypointNameMock);

    t.true(pilot._mcp.headingMode === 'LNAV');
});

ava('.proceedDirect() calls .exitHold()', (t) => {
    const pilot = createPilotFixture();
    const exitHoldSpy = sinon.spy(pilot, 'exitHold');

    pilot._fms.setFlightPhase('HOLD');
    pilot.proceedDirect(waypointNameMock);

    t.true(exitHoldSpy.calledWithExactly());
});

ava('.proceedDirect() returns success message when finished', (t) => {
    const expectedResult = [true, 'proceed direct SUNST'];
    const pilot = createPilotFixture();
    const result = pilot.proceedDirect(waypointNameMock);

    t.deepEqual(result, expectedResult);
});

ava('.sayTargetHeading() returns a message when #headingMode is HOLD', (t) => {
    const modeController = new ModeController();
    const pilot = new Pilot(createFmsArrivalFixture(), modeController);
    const expectedResult = [
        true,
        {
            log: 'we\'re assigned heading 180',
            say: 'we\'re assigned heading one eight zero'
        }
    ];
    pilot._mcp.headingMode = 'HOLD';
    pilot._mcp.heading = 3.141592653589793;

    const result = pilot.sayTargetHeading();

    t.deepEqual(result, expectedResult);
});

ava('.sayTargetHeading() returns a message when #headingMode is VOR/LOC', (t) => {
    const modeController = new ModeController();
    const pilot = new Pilot(createFmsArrivalFixture(), modeController);
    const expectedResult = [
        true,
        {
            log: 'we\'re joining a course of 180',
            say: 'we\'re joining a course of one eight zero'
        }
    ];
    pilot._mcp.headingMode = 'VOR_LOC';
    pilot._mcp.course = 180;

    const result = pilot.sayTargetHeading();

    t.deepEqual(result, expectedResult);
});

ava.todo('.sayTargetHeading() returns a message when #headingMode is LNAV');

ava('.sayTargetHeading() returns a message when #headingMode is OFF', (t) => {
    const modeController = new ModeController();
    const pilot = new Pilot(createFmsArrivalFixture(), modeController);
    const expectedResult = [
        true,
        {
            log: 'we haven\'t been assigned a heading',
            say: 'we haven\'t been assigned a heading'
        }
    ];
    const result = pilot.sayTargetHeading();

    t.deepEqual(result, expectedResult);
});
