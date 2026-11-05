import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, signal } from '@angular/core';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [MatIconModule, RouterLink],
  template: `
    <div class="dashboard">
      <div class="page-heading">
        <div><p class="eyebrow">THURSDAY, 05 NOVEMBER 2026 <span class="live-dot"></span> LIVE</p><h1>Good morning, Aarav</h1><p class="subheading">Here is what is happening across your operations today.</p></div>
        <button class="primary-action" type="button" routerLink="/orders"><mat-icon>add</mat-icon> Create order</button>
      </div>
      <section class="metric-grid" aria-label="Business summary">
        <article class="metric"><div class="metric-top"><span>Total customers</span><span class="metric-icon green"><mat-icon>groups</mat-icon></span></div><strong>1,284</strong><div class="metric-foot"><span class="positive">+8.2%</span><span>vs last month</span><span class="sparkline green-line">▁▂▁▃▂▄▃▅▆</span></div></article>
        <article class="metric"><div class="metric-top"><span>Open orders</span><span class="metric-icon amber"><mat-icon>receipt_long</mat-icon></span></div><strong>86</strong><div class="metric-foot"><span class="positive">+12.4%</span><span>vs last month</span><span class="sparkline amber-line">▂▃▂▄▃▅▄▆▅</span></div></article>
        <article class="metric"><div class="metric-top"><span>Monthly sales</span><span class="metric-icon blue"><mat-icon>trending_up</mat-icon></span></div><strong>₹24.8L</strong><div class="metric-foot"><span class="positive">+6.8%</span><span>vs last month</span><span class="sparkline blue-line">▁▂▃▂▄▃▅▄▆</span></div></article>
        <article class="metric"><div class="metric-top"><span>Outstanding</span><span class="metric-icon coral"><mat-icon>account_balance_wallet</mat-icon></span></div><strong>₹8.35L</strong><div class="metric-foot"><span class="negative">+2.1%</span><span>vs last month</span><span class="sparkline coral-line">▃▂▄▃▅▄▃▅▄</span></div></article>
      </section>
      <section class="overview-grid">
        <article class="panel revenue-panel">
          <div class="panel-heading"><div><h2>Revenue overview</h2><p>Sales performance across the last 12 months</p></div><label class="period-control"><select class="select-button" aria-label="Revenue time range" (change)="changeRevenuePeriod($event)"><option value="year">This year</option><option value="6m">Last 6 months</option></select><mat-icon>expand_more</mat-icon></label></div>
          <div class="chart-wrap"><canvas #revenueCanvas aria-label="Monthly revenue and target chart" role="img"></canvas></div>
          <div class="chart-legend"><span><i class="legend-dot revenue"></i>Revenue</span><span><i class="legend-dot target"></i>Target</span><strong>₹2.48 Cr <small>annual sales</small></strong></div>
        </article>
        <article class="panel status-panel">
          <div class="panel-heading"><div><h2>Order pipeline</h2><p>86 active orders</p></div><button class="more-button" type="button" title="More order pipeline options" aria-label="More order pipeline options" [attr.aria-expanded]="pipelineMenuOpen()" (click)="togglePipelineMenu()"><mat-icon>more_horiz</mat-icon></button></div>
          @if (pipelineMenuOpen()) {
            <div class="pipeline-actions"><a routerLink="/orders">Review orders</a><a routerLink="/production">Production overview</a></div>
          }
          <div class="pipeline-total"><strong>86</strong><span>orders in progress</span></div>
          <div class="pipeline-list">
            <div class="pipeline-row"><span class="pipeline-label"><i class="status-swatch draft"></i>Awaiting approval</span><strong>12</strong></div><div class="pipeline-track"><span style="width:22%;background:#dfa45b"></span></div>
            <div class="pipeline-row"><span class="pipeline-label"><i class="status-swatch production"></i>In production</span><strong>34</strong></div><div class="pipeline-track"><span style="width:61%;background:#4b8c76"></span></div>
            <div class="pipeline-row"><span class="pipeline-label"><i class="status-swatch dispatch"></i>Ready to dispatch</span><strong>18</strong></div><div class="pipeline-track"><span style="width:36%;background:#6996b0"></span></div>
            <div class="pipeline-row"><span class="pipeline-label"><i class="status-swatch delivery"></i>Out for delivery</span><strong>22</strong></div><div class="pipeline-track"><span style="width:43%;background:#d77e60"></span></div>
          </div>
        </article>
      </section>
      <section class="lower-grid">
        <article class="panel orders-panel">
          <div class="panel-heading"><div><h2>Recent orders</h2><p>Latest activity from your customers</p></div><a class="text-link" routerLink="/orders">View all <mat-icon>arrow_forward</mat-icon></a></div>
          <div class="table-scroll"><table><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>DATE</th><th>AMOUNT</th><th>STATUS</th></tr></thead><tbody>
            <tr><td class="order-number">#BO-2481</td><td>Shree Ganesh Builders</td><td>05 Nov 2026</td><td>₹1,24,500</td><td><span class="pill in-production">In production</span></td></tr>
            <tr><td class="order-number">#BO-2480</td><td>Metro Construction Co.</td><td>05 Nov 2026</td><td>₹86,200</td><td><span class="pill ready">Ready to dispatch</span></td></tr>
            <tr><td class="order-number">#BO-2479</td><td>R K Infra Projects</td><td>04 Nov 2026</td><td>₹2,18,000</td><td><span class="pill confirmed">Confirmed</span></td></tr>
            <tr><td class="order-number">#BO-2478</td><td>Vishal Traders</td><td>04 Nov 2026</td><td>₹64,800</td><td><span class="pill delivered">Delivered</span></td></tr>
          </tbody></table></div>
        </article>
        <article class="panel delivery-panel">
          <div class="panel-heading"><div><h2>Today's deliveries</h2><p>Thursday, 05 November</p></div><span class="delivery-count">06</span></div>
          <div class="delivery-list">
            <div class="delivery-item"><span class="time-badge">09:30</span><div><strong>Metro Construction Co.</strong><small>MH 12 AB 4312 · 2,500 bricks</small></div><span class="delivery-state loading">Loading</span></div>
            <div class="delivery-item"><span class="time-badge">11:00</span><div><strong>Vishal Traders</strong><small>MH 14 CD 2208 · 1,800 bricks</small></div><span class="delivery-state transit">In transit</span></div>
            <div class="delivery-item"><span class="time-badge">14:15</span><div><strong>R K Infra Projects</strong><small>MH 12 EF 1094 · 4,000 bricks</small></div><span class="delivery-state pending">Pending</span></div>
          </div>
          <a class="text-link delivery-link" routerLink="/deliveries">Delivery schedule <mat-icon>arrow_forward</mat-icon></a>
        </article>
      </section>
      <footer class="dashboard-footer"><span>Plant status <i class="live-dot"></i> All production lines running</span><span>Last synced 2 minutes ago</span></footer>
    </div>
  `,
  styles: [`
    :host { display:block; --ink:#1f2925; --muted:#77827c; --line:#e7eae6; --forest:#24554b; --paper:#fff; }
    .page-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; margin-bottom:23px; }
    .eyebrow { display:flex; align-items:center; gap:8px; margin:0 0 9px; color:#7e8982; font-size:9px; font-weight:700; letter-spacing:1.1px; }
    .live-dot { display:inline-block; width:6px; height:6px; border-radius:50%; background:#62a77d; box-shadow:0 0 0 3px #62a77d1c; }
    h1 { margin:0; color:#202d27; font:700 26px/1.2 Manrope,sans-serif; letter-spacing:0; }
    .subheading { margin:8px 0 0; color:#7b8680; font-size:12px; }
    .primary-action { display:flex; align-items:center; gap:8px; min-height:38px; padding:0 14px; color:#fff; background:#24554b; border:0; border-radius:5px; font:600 11px 'DM Sans',sans-serif; cursor:pointer; }
    .primary-action:hover { background:#183c36; }.primary-action mat-icon { font-size:17px; width:17px; height:17px; }
    .metric-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; }
    .metric,.panel { background:var(--paper); border:1px solid var(--line); border-radius:7px; }
    .metric { min-width:0; padding:15px 16px 13px; }
    .metric-top { display:flex; justify-content:space-between; align-items:center; color:#76827b; font-size:11px; }
    .metric-icon { width:29px; height:29px; display:grid; place-items:center; border-radius:6px; }
    .metric-icon mat-icon { font-size:17px; width:17px; height:17px; }.metric-icon.green { color:#367b61; background:#eaf3ed; }.metric-icon.amber { color:#b47c3d; background:#fbf1e4; }.metric-icon.blue { color:#547e99; background:#eaf1f5; }.metric-icon.coral { color:#bd6d57; background:#f9eee9; }
    .metric > strong { display:block; margin:8px 0 10px; color:#26342d; font:700 25px/1.1 Manrope,sans-serif; letter-spacing:0; }
    .metric-foot { display:flex; align-items:center; gap:5px; color:#909992; font-size:9px; white-space:nowrap; }.positive { color:#40845f; font-weight:700; }.negative { color:#c27d56; font-weight:700; }.sparkline { margin-left:auto; font-size:14px; letter-spacing:0; }.green-line { color:#6ba681; }.amber-line { color:#d5a35b; }.blue-line { color:#7298ae; }.coral-line { color:#d1846a; }
    .overview-grid { display:grid; grid-template-columns:minmax(0,1.7fr) minmax(270px,1fr); gap:14px; margin-top:15px; }
    .lower-grid { display:grid; grid-template-columns:minmax(0,1.7fr) minmax(300px,1fr); gap:14px; margin-top:15px; }
    .panel { min-width:0; padding:17px 18px; }
    .panel-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:15px; }
    .panel-heading h2 { margin:0; color:#26342d; font:700 13px Manrope,sans-serif; letter-spacing:0; }.panel-heading p { margin:5px 0 0; color:#919a94; font-size:10px; }
    .select-button,.more-button { display:flex; align-items:center; justify-content:center; gap:7px; min-height:28px; padding:0 8px; color:#69766f; background:#fff; border:1px solid #e8ebe7; border-radius:4px; font:500 10px 'DM Sans',sans-serif; cursor:pointer; }.select-button mat-icon,.more-button mat-icon { width:15px; height:15px; font-size:15px; }.more-button { width:29px; padding:0; border-color:transparent; }
    .period-control { position:relative; display:flex; align-items:center; }.period-control select { appearance:none; padding-right:25px; }.period-control mat-icon { position:absolute; right:7px; pointer-events:none; color:#69766f; }
    .pipeline-actions { position:absolute; z-index:5; top:51px; right:16px; display:grid; min-width:150px; padding:5px; background:#fff; border:1px solid var(--line); border-radius:5px; box-shadow:0 10px 24px #15251f1c; }.pipeline-actions a { padding:8px; color:#52645a; border-radius:3px; font-size:10px; text-decoration:none; }.pipeline-actions a:hover { background:#f2f5f2; }
    .chart-wrap { height:194px; margin:16px 0 6px; }.chart-legend { display:flex; align-items:center; gap:15px; color:#78847d; font-size:9px; }.legend-dot { display:inline-block; width:7px; height:7px; margin-right:6px; border-radius:50%; }.legend-dot.revenue { background:#41846d; }.legend-dot.target { background:#e1b06d; }.chart-legend strong { margin-left:auto; color:#26342d; font:700 13px Manrope,sans-serif; }.chart-legend small { display:block; margin-top:2px; color:#929b95; text-align:right; font:400 9px 'DM Sans',sans-serif; }
    .pipeline-total { display:flex; align-items:baseline; gap:7px; margin:22px 0 17px; }.pipeline-total strong { color:#25352d; font:700 28px Manrope,sans-serif; }.pipeline-total span { color:#929b95; font-size:10px; }
    .pipeline-list { display:grid; gap:8px; }.pipeline-row { display:flex; align-items:center; justify-content:space-between; color:#627068; font-size:10px; }.pipeline-row strong { color:#35443c; font-size:10px; }.pipeline-label { display:flex; align-items:center; gap:7px; }.status-swatch { width:7px; height:7px; border-radius:2px; }.status-swatch.draft { background:#dfa45b; }.status-swatch.production { background:#4b8c76; }.status-swatch.dispatch { background:#6996b0; }.status-swatch.delivery { background:#d77e60; }.pipeline-track { height:4px; margin:0 0 5px 14px; background:#f0f2ef; border-radius:9px; }.pipeline-track span { display:block; height:100%; border-radius:9px; }
    .orders-panel { padding-right:0; }.table-scroll { overflow-x:auto; margin:16px 0 0; }table { width:100%; border-collapse:collapse; text-align:left; white-space:nowrap; }th { padding:0 12px 9px 0; color:#9ba39e; font-size:8px; font-weight:700; letter-spacing:.6px; }td { padding:10px 12px 10px 0; border-top:1px solid #eff1ee; color:#69766f; font-size:10px; }td.order-number { color:#2c6253; font-weight:700; }td:last-child { padding-right:18px; }.pill { display:inline-block; padding:4px 7px; border-radius:3px; font-size:8px; font-weight:600; }.pill.in-production { color:#40775e; background:#eaf3ed; }.pill.ready { color:#547b91; background:#edf3f6; }.pill.confirmed { color:#a9783f; background:#fbf3e7; }.pill.delivered { color:#6d7980; background:#eff1f2; }
    .text-link { display:flex; align-items:center; gap:5px; color:#34715c; text-decoration:none; font-size:10px; font-weight:600; white-space:nowrap; }.text-link mat-icon { width:14px; height:14px; font-size:14px; }.delivery-count { display:grid; place-items:center; width:28px; height:28px; color:#34715c; background:#eaf3ed; border-radius:5px; font-size:10px; font-weight:700; }
    .delivery-list { display:grid; gap:0; margin-top:14px; }.delivery-item { display:grid; grid-template-columns:42px minmax(0,1fr) auto; align-items:center; gap:8px; padding:11px 0; border-top:1px solid #eff1ee; }.time-badge { color:#65756b; font-size:9px; font-weight:700; }.delivery-item strong { display:block; overflow:hidden; color:#35443c; font-size:10px; text-overflow:ellipsis; white-space:nowrap; }.delivery-item small { display:block; margin-top:4px; color:#929b95; font-size:8px; white-space:nowrap; }.delivery-state { padding:4px 6px; border-radius:3px; font-size:8px; }.delivery-state.loading { color:#9f7441; background:#fbf2e7; }.delivery-state.transit { color:#517a92; background:#edf3f6; }.delivery-state.pending { color:#77827b; background:#f0f2ef; }.delivery-link { justify-content:flex-end; margin-top:7px; }
    .dashboard-footer { display:flex; justify-content:space-between; margin-top:17px; color:#929b95; font-size:9px; }.dashboard-footer > span:first-child { display:flex; align-items:center; gap:7px; }
    @media (max-width:1100px) { .metric-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }.overview-grid,.lower-grid { grid-template-columns:minmax(0,1fr); }.status-panel { min-height:260px; } }
    @media (max-width:560px) { .page-heading { align-items:flex-start; flex-direction:column; }.page-heading h1 { font-size:22px; }.primary-action { min-height:36px; }.metric-grid { gap:9px; }.metric { padding:12px; }.metric > strong { font-size:22px; }.metric-foot { flex-wrap:wrap; }.sparkline { display:none; }.panel { padding:15px 13px; }.orders-panel { padding-right:0; }.dashboard-footer { align-items:flex-start; flex-direction:column; gap:8px; } }
  `]
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('revenueCanvas') private revenueCanvas!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart<'line'>;
  readonly pipelineMenuOpen = signal(false);

  readonly revenueData: ChartData<'line'> = {
    labels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
    datasets: [
      { label: 'Revenue', data: [14, 18, 16, 23, 21, 28, 24, 31, 29, 35, 33, 42], borderColor: '#43866e', backgroundColor: 'rgba(67,134,110,.10)', fill: true, tension: .38, pointRadius: 2, pointHoverRadius: 4, borderWidth: 2 },
      { label: 'Target', data: [16, 17, 18, 20, 22, 23, 25, 27, 29, 30, 32, 34], borderColor: '#dfb16e', borderDash: [4, 5], tension: .35, pointRadius: 0, borderWidth: 1.5 }
    ]
  };
  readonly revenueOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { intersect: false, mode: 'index' } },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: '#929b95', font: { family: 'DM Sans', size: 9 } } },
      y: { min: 0, max: 50, grid: { color: '#eff1ee' }, border: { display: false }, ticks: { stepSize: 10, color: '#929b95', font: { family: 'DM Sans', size: 9 }, callback: (value) => `₹${value}L` } }
    }
  };

  ngAfterViewInit(): void {
    Chart.register(...registerables);
    this.chart = new Chart(this.revenueCanvas.nativeElement, {
      type: 'line',
      data: this.revenueData,
      options: this.revenueOptions
    });
  }

  togglePipelineMenu(): void {
    this.pipelineMenuOpen.update((open) => !open);
  }

  changeRevenuePeriod(event: Event): void {
    if (!this.chart) return;
    const showSixMonths = (event.target as HTMLSelectElement).value === '6m';
    const start = showSixMonths ? 6 : 0;
    this.chart.data.labels = this.revenueData.labels?.slice(start);
    this.chart.data.datasets[0].data = this.revenueData.datasets[0].data.slice(start);
    this.chart.data.datasets[1].data = this.revenueData.datasets[1].data.slice(start);
    this.chart.update();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
